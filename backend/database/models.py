from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    email: Mapped[str] = mapped_column(String(254), unique=True)
    password_hash: Mapped[str | None] = mapped_column(Text)
    google_id: Mapped[str | None] = mapped_column(Text, unique=True)

    # === RELATIONSHIPS ===
    # Parent of 'Folder' table => these are folders that a user has created
    folders: Mapped[list["Folder"]] = relationship("Folder", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True)

    # Parent of 'Document' table => these are documents that a user has uploaded
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="owner", cascade="all, delete-orphan", passive_deletes=True)


class Folder(Base):
    __tablename__ = "folders"
    id: Mapped[int] = mapped_column(primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    name: Mapped[str] = mapped_column(String(255))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    parent_folder_id: Mapped[int | None] = mapped_column(ForeignKey("folders.id", ondelete="CASCADE"), index=True)

    # === RELATIONSHIPS ===
    # Child of 'User' table => this is the owner of the folder
    owner: Mapped["User"] = relationship("User", back_populates="folders")

    # Parent of 'Document' table => these are documents inside a folder
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="folder", cascade="all, delete-orphan", passive_deletes=True)

    # Parent of 'Folder' table => this is the folder that contains folders
    parent_folder: Mapped["Folder | None"] = relationship("Folder", back_populates="sub_folders", remote_side=[id])

    # Child of 'Folder' table => these are folders inside a folder
    sub_folders: Mapped[list["Folder"]] = relationship("Folder", back_populates="parent_folder", cascade="all, delete-orphan", passive_deletes=True)


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[int] = mapped_column(primary_key=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(127))
    file_size: Mapped[int] = mapped_column(BigInteger)
    object_key: Mapped[str] = mapped_column(String(1024), unique=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    folder_id: Mapped[int | None] = mapped_column(ForeignKey("folders.id", ondelete="CASCADE"), index=True)

    # === RELATIONSHIPS ===
    # Parent of 'Chunk' table => these are chunks from a document
    chunks: Mapped[list["Chunk"]] = relationship("Chunk", back_populates="document", cascade="all, delete-orphan", passive_deletes=True)

    # Child of 'User' table => this is the owner of a document
    owner: Mapped["User"] = relationship("User", back_populates="documents")

    # Child of 'Folder' table => this is the folder where a document lives
    folder: Mapped["Folder | None"] = relationship("Folder", back_populates="documents")


class Chunk(Base):
    __tablename__ = "chunks"
    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(384))
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)

    # === RELATIONSHIPS ===
    # Child of 'Document' table => this is the document where this chunk is from
    document: Mapped["Document"] = relationship("Document", back_populates="chunks")
