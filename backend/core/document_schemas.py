from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    mime_type: str
    file_size: int
    uploaded_at: datetime
    folder_id: int | None
