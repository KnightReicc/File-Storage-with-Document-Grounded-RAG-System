import logging
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from core.common_schemas import RenameRequest
from core.config import settings
from core.deps import get_current_user
from core.document_schemas import DocumentResponse
from core.mime import sniff_mime_type
from database.models import Document, Folder, User
from database.session import get_db
from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool
from storage.client import delete_file, upload_file

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file_obj: UploadFile,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    folder_id: int | None = Form(default=None),
):
    """Handles the document upload endpoint."""

    # If the document is inside a folder, verify folder & ownership
    if folder_id is not None:
        query = select(Folder).where(Folder.id == folder_id, Folder.owner_id == current_user.id)
        result = await db.execute(query)
        verified_folder = result.scalars().first()
        if not verified_folder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Folder not found or access denied.",
            )

    # Make sure the file has size
    if file_obj.size is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to determine file size.")
    # Enforce a file size limit
    if file_obj.size > (settings.max_upload_size_mb * 1024 * 1024):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the limit of {settings.max_upload_size_mb}MB.",
        )

    # Detect the mime type of the file being uploaded
    true_mime_type = sniff_mime_type(file_obj)

    # Generate uuid
    safe_filename = file_obj.filename or "untitled"
    unique_key = f"{current_user.id}/{uuid4()}{Path(safe_filename).suffix}"

    # Save to MinIO first
    try:
        await run_in_threadpool(upload_file, file_obj=file_obj, object_key=unique_key)
    except RuntimeError as e:
        logger.exception("MinIO upload failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage system unavailable, please try again later.",
        ) from e

    # Then, save to database second
    try:
        new_document = Document(
            name=safe_filename,
            mime_type=true_mime_type,
            file_size=file_obj.size,
            object_key=unique_key,
            owner_id=current_user.id,
            folder_id=folder_id,
        )
        db.add(new_document)
        await db.commit()
        await db.refresh(new_document)
    except Exception as e:
        # In case MinIO had a successful operation, but the database didn't
        await db.rollback()
        logger.exception("Database save operation failed")

        try:
            # In case an orphan object is left inside the bucket
            await run_in_threadpool(delete_file, object_key=unique_key)
        except RuntimeError:
            logger.exception(f"Warning, orphan file left in MinIO, key={unique_key}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save new document record, database rolled back.",
        ) from e

    return new_document


@router.patch("/{document_id}", response_model=DocumentResponse)
async def rename_document(
    user_inp: RenameRequest,
    document_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handles the document renaming endpoint."""

    # Verify document & ownership
    query = select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    result = await db.execute(query)
    verified_document = result.scalars().first()
    if not verified_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    verified_document.name = user_inp.name
    await db.commit()
    await db.refresh(verified_document)

    return verified_document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handles the document deletion endpoint."""

    # Verify document and ownership
    query = select(Document).where(Document.id == document_id, Document.owner_id == current_user.id)
    result = await db.execute(query)
    verified_document = result.scalars().first()
    if not verified_document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found or access denied.")

    # Delete MinIO record first, and cancel operation upon failure
    try:
        await run_in_threadpool(delete_file, object_key=verified_document.object_key)
    except RuntimeError as e:
        logger.exception("MinIO deletion failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage system unavailable, please try again later.",
        ) from e

    # Delete database record upon successful MinIO deletion
    try:
        await db.delete(verified_document)
        await db.commit()
    except Exception:
        await db.rollback()
        logger.exception(f"Dangling document reference - file deleted from MinIO but DB row remains, id={document_id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File removed from storage, but failed to update the database record.",
        )
