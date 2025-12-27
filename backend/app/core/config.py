from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore",
    )

    project_name: str = "BOM Generator"
    api_v1_prefix: str = "/api/v1"
    database_url: str = Field(..., validation_alias="DATABASE_URL")


settings = Settings()
