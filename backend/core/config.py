from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MemoryOS"
    VALKEY_HOST: str = "localhost"
    VALKEY_PORT: int = 6379

    class Config:
        env_file = ".env"

settings = Settings()
