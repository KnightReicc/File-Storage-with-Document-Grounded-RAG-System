"""
Contains pydantic schemas that are used by multiple models or endpoints.
Currently, some common schemas here are used in:
- backend/api/folders
- backend/api/documents
"""

from pydantic import BaseModel, Field

MAX_INT4 = 2_147_483_647


# Renaming folders and documents
class RenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
