import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from core.config import settings

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
