from pydantic import BaseModel, Field


class FileEdit(BaseModel):
    should_modify: bool = Field(
        description="Whether the target file needs modification"
    )

    content: str = Field(
        description="Complete updated file content"
    )