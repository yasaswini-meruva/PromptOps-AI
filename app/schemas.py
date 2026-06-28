from typing import Optional

from pydantic import BaseModel, field_validator


class PromptRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def prompt_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Prompt cannot be empty.")
        if len(v) > 8000:
            raise ValueError("Prompt exceeds the 8,000-character limit.")
        return v


class SaveVersionRequest(BaseModel):
    name: str
    prompt: str
    score: Optional[float] = None

    @field_validator("name", "prompt")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty.")
        return v


class PlaygroundRequest(BaseModel):
    prompt_a: str
    prompt_b: str


class UserCreate(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("username", "password", "email")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty.")
        return v

    @field_validator("email")
    @classmethod
    def email_format(cls, v: str) -> str:
        if "@" not in v or "." not in v:
            raise ValueError("Email must be a valid email address.")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    created_at: Optional[str] = None


class ABTestRequest(BaseModel):
    prompt_a: str
    prompt_b: str
    test_inputs: list[str]

    @field_validator("test_inputs")
    @classmethod
    def at_least_one_input(cls, v: list) -> list:
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("Provide at least one test input.")
        if len(cleaned) > 10:
            raise ValueError("Maximum 10 test inputs per run.")
        return cleaned