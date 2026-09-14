from typing import Annotated, Literal

from core.common_schemas import RenameRequest
from core.deps import get_current_user
from core.folder_schemas import FolderContentsResponse, FolderCreate, FolderResponse
from database.models import Document, Folder, User
from database.session import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


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
                detail="Parent folder not found or access denied.",
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
    folder_id: int | None = None,
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
                detail="Folder not found or access denied.",
            )

    # Base queries for secured queries
    base_folder_query = select(Folder).where(Folder.owner_id == current_user.id)
    base_document_query = select(Document).where(Document.owner_id == current_user.id)

    if search:
        folder_query = base_folder_query.where(Folder.name.ilike(f"%{search}%"))
        document_query = base_document_query.where(Document.name.ilike(f"%{search}%"))
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
    folder_id: int,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found or access denied.")

    verified_folder.name = user_inp.name
    await db.commit()
    await db.refresh(verified_folder)

    return verified_folder
