import logging
from typing import Annotated, Literal

from core.common_schemas import MAX_INT4, RenameRequest
from core.deps import get_current_user
from core.folder_schemas import FolderContentsResponse, FolderCreate, FolderResponse
from database.models import Document, Folder, User
from database.session import get_db
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi import Path as FastAPIPath
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool
from storage.client import delete_file

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    folder_input: FolderCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handles folder creation inside or outside (root level) of a folder."""

    # Check if the folder is being created inside a folder, verify folder & ownership
    if folder_input.parent_folder_id is not None:
        query = select(Folder).where(Folder.id == folder_input.parent_folder_id, Folder.owner_id == current_user.id)
        result = await db.execute(query)
        found_folder_and_user = result.scalars().first()
        if not found_folder_and_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent folder not found.",
            )

    # Save the new folder to database
    new_folder = Folder(**folder_input.model_dump(), owner_id=current_user.id)
    db.add(new_folder)
    await db.commit()
    await db.refresh(new_folder)

    return new_folder


@router.get("/contents", response_model=FolderContentsResponse)
async def read_folder(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    folder_id: Annotated[int | None, Query(ge=1, le=MAX_INT4)] = None,
    search: str | None = None,
    sort_by: Literal["date", "name", "size"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
):
    """Handles the folder content fetching endpoint (e.g. subfolders, documents)."""

    # If the folder is inside a folder, verify folder & ownership
    if folder_id is not None:
        query = select(Folder).where(Folder.id == folder_id, Folder.owner_id == current_user.id)
        result = await db.execute(query)
        verified_folder = result.scalars().first()
        if not verified_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found.",
            )

    # Base queries for secured queries
    base_folder_query = select(Folder).where(Folder.owner_id == current_user.id)
    base_document_query = select(Document).where(Document.owner_id == current_user.id)

    if search:
        folder_query = base_folder_query.where(Folder.name.icontains(search, autoescape=True))
        document_query = base_document_query.where(Document.name.icontains(search, autoescape=True))
    else:
        folder_query = base_folder_query.where(Folder.parent_folder_id == folder_id)
        document_query = base_document_query.where(Document.folder_id == folder_id)

    # Pre-determine the columns that's going to be used for display
    if sort_by == "date":
        folder_col = Folder.updated_at
        document_col = Document.updated_at
    elif sort_by == "name":
        folder_col = Folder.name
        document_col = Document.name
    elif sort_by == "size":
        folder_col = Folder.updated_at  # falls back to date as folders don't have size
        document_col = Document.file_size

    # Order the col values in sort_by value
    if sort_order == "desc":
        final_folder_query = folder_query.order_by(folder_col.desc())
        final_document_query = document_query.order_by(document_col.desc())
    elif sort_order == "asc":
        final_folder_query = folder_query.order_by(folder_col.asc())
        final_document_query = document_query.order_by(document_col.asc())

    folder_results = (await db.execute(final_folder_query)).scalars().all()
    document_results = (await db.execute(final_document_query)).scalars().all()

    return {"folders": folder_results, "documents": document_results}


@router.patch("/{folder_id}", response_model=FolderResponse)
async def rename_folder(
    folder_id: Annotated[int, FastAPIPath(ge=1, le=MAX_INT4)],
    user_inp: RenameRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handles the folder renaming endpoint."""

    # Verify folder & ownership
    query = select(Folder).where(Folder.id == folder_id, Folder.owner_id == current_user.id)
    result = await db.execute(query)
    verified_folder = result.scalars().first()
    if not verified_folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found.")

    verified_folder.name = user_inp.name
    await db.commit()
    await db.refresh(verified_folder)

    return verified_folder


async def _get_folder_and_descendant_ids(db: AsyncSession, root_folder_id: int) -> list[int]:
    """Helper function for returning the given folder's ID plus every subfolder ID nested under it, at any depth."""

    # Anchor member: the starting folder itself
    folder_cte = select(Folder.id).where(Folder.id == root_folder_id).cte(name="folder_hierarchy", recursive=True)

    # Recursive member: folders whose parent is already in the CTE's result set so far
    folder_alias = folder_cte.alias()
    recursive_part = select(Folder.id).join(folder_alias, Folder.parent_folder_id == folder_alias.c.id)

    folder_cte = folder_cte.union_all(recursive_part)

    result = await db.execute(select(folder_cte.c.id))
    return [row[0] for row in result.all()]


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: Annotated[int, FastAPIPath(ge=1, le=MAX_INT4)],
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handles folder deletion endpoint. Also deletes content inside."""

    # Verify folder and ownership
    query = select(Folder).where(Folder.id == folder_id, Folder.owner_id == current_user.id)
    result = await db.execute(query)
    verified_folder = result.scalars().first()
    if not verified_folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found.")

    # Query the folder's id and every id of its content with ownership
    folder_and_descendant_ids = await _get_folder_and_descendant_ids(db=db, root_folder_id=verified_folder.id)
    descendant_item_query = select(Document).where(
        Document.folder_id.in_(folder_and_descendant_ids), Document.owner_id == current_user.id
    )
    descendant_item_result = await db.execute(descendant_item_query)
    descendant_documents = descendant_item_result.scalars().all()

    # Loop through the documents with the queried descendant ids, and delete them
    deleted_keys = []  # record the deleted objects
    for document in descendant_documents:
        try:
            await run_in_threadpool(delete_file, object_key=document.object_key)
            deleted_keys.append(document.object_key)
        except RuntimeError as e:
            logger.exception(
                f"Failed to delete MinIO object during folder deletion, key={document.object_key}. "
                f"Successfully deleted items before failure, keys={deleted_keys}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete one or more files. Some files may not have been removed.",
            ) from e

    # Delete the parent folder after deleting inner contents
    try:
        await db.delete(verified_folder)
        await db.commit()
    except Exception as e:
        await db.rollback()
        logger.exception(
            f"Dangling folder reference - file removed from MinIO but folder {folder_id} and its contents remain in the database"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Files were removed from storage, but the folder and its contents could not be removed from the database.",
        ) from e
