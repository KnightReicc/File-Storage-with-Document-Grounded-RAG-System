from datetime import datetime

from core.document_schemas import DocumentResponse
from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_folder_id: int | None = None


class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    created_at: datetime
    parent_folder_id: int | None


class FolderContentsResponse(BaseModel):
    folders: list[FolderResponse]
    documents: list[DocumentResponse]
