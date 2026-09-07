import magic
from fastapi import UploadFile


def sniff_mime_type(file_obj: UploadFile) -> str:
    """Detects file mime type by the file's first bytes."""
    try:
        # Ensure the read starts from the top
        file_obj.file.seek(0)
        # Reads the first 2048 bytes
        first_2048_bytes = file_obj.file.read(2048)
        return magic.from_buffer(first_2048_bytes, mime=True)
    finally:
        file_obj.file.seek(0)
