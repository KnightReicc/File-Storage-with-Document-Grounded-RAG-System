import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from core.config import settings
from fastapi import UploadFile

s3_client = boto3.client(
    "s3",
    endpoint_url=f"http://{settings.minio_endpoint}",
    aws_access_key_id=settings.minio_access_key,
    aws_secret_access_key=settings.minio_secret_key,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1",
)


def bucket_exists(bucket_name: str = settings.minio_bucket_name) -> bool:
    """Checks if a bucket exists and whether we have permission to access it."""

    try:
        s3_client.head_bucket(Bucket=bucket_name)
    except ClientError as e:
        # Extract HTTP error code
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            return False
        # Catch other config errors
        raise RuntimeError(f"Error checking bucket access: {error_code}") from e
    return True


def ensure_bucket_exists(bucket_name: str = settings.minio_bucket_name) -> None:
    """Creates the bucket if it doesn't already exist. Called once at app startup."""

    if bucket_exists(bucket_name):
        return

    try:
        s3_client.create_bucket(Bucket=bucket_name)
    except ClientError as e:
        raise RuntimeError(f"Failed to create bucket: {e.response['Error']['Message']}") from e


def upload_file(file_obj: UploadFile, object_key: str, bucket_name: str = settings.minio_bucket_name) -> None:
    """Streams a FastAPI UploadFile object to the bucket."""

    try:
        # Seek back to the beginning of the file to guarantee a full read from the top of the file
        file_obj.file.seek(0)
        s3_client.upload_fileobj(
            Fileobj=file_obj.file, Bucket=bucket_name, Key=object_key, ExtraArgs={"ContentType": file_obj.content_type}
        )
    except ClientError as e:
        raise RuntimeError(f"Failed to upload object to the bucket: {e.response['Error']['Message']}") from e


def generate_download_url(object_key: str, bucket_name: str = settings.minio_bucket_name) -> str:
    """Generates a download url of the file in the bucket."""

    try:
        url = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": bucket_name, "Key": object_key}, ExpiresIn=300
        )
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to generate download url from the object: {e.response['Error']['Message']}") from e


def delete_file(object_key: str, bucket_name: str = settings.minio_bucket_name) -> None:
    """Deletes a file from the bucket."""
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=object_key)
    except ClientError as e:
        raise RuntimeError(f"Failed to delete object from the bucket: {e.response['Error']['Message']}") from e
