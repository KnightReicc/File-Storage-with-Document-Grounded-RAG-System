from typing import Annotated

from core.deps import get_current_user
from core.folder_schemas import FolderCreate, FolderResponse
from database.models import Folder, User
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
    # Check if the folder is being created inside a folder
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
