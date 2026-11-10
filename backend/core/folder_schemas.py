from datetime import datetime
from typing import Annotated

from core.common_schemas import MAX_INT4
from core.document_schemas import DocumentResponse
from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_folder_id: Annotated[int | None, Field(ge=1, le=MAX_INT4)] = None


class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    created_at: datetime
    updated_at: datetime
    parent_folder_id: int | None


class FolderContentsResponse(BaseModel):
    folders: list[FolderResponse]
    documents: list[DocumentResponse]
