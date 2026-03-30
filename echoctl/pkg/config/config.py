"""Configuration management for echoctl"""

import os
import json
from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    """Configuration for echoctl CLI"""
    
    model_config = SettingsConfigDict(
        env_prefix="ECHOMEN_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    
    # Backend connection
    backend_url: str = Field(
        default="http://localhost:3001",
        description="ECHOMEN backend URL",
    )
    
    # API Keys (can also be set via environment variables)
    api_key: Optional[str] = Field(
        default=None,
        description="ECHOMEN API key",
    )
    
    gemini_api_key: Optional[str] = Field(
        default=None,
        description="Google Gemini API key",
    )
    
    openai_api_key: Optional[str] = Field(
        default=None,
        description="OpenAI API key",
    )
    
    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API key",
    )
    
    # Provider selection
    provider: str = Field(
        default="gemini",
        description="AI provider to use (gemini, openai, anthropic)",
    )
    
    # Agent settings
    default_agent: str = Field(
        default="god",
        description="Default agent type to use",
    )
    
    max_depth: int = Field(
        default=3,
        description="Maximum agent recursion depth",
    )
    
    # Timeout settings
    timeout: float = Field(
        default=120.0,
        description="Request timeout in seconds",
    )
    
    # UI settings
    use_colors: bool = Field(
        default=True,
        description="Enable colored output",
    )
    
    # Auto-approve settings
    auto_approve_tools: list[str] = Field(
        default_factory=list,
        description="Tools to auto-approve (bypass HITL)",
    )
    
    @property
    def config_dir(self) -> Path:
        """Get configuration directory"""
        return Path.home() / ".echoctl"
    
    @property
    def config_file(self) -> Path:
        """Get configuration file path"""
        return self.config_dir / "config.json"
    
    @classmethod
    def load(cls) -> "Config":
        """Load configuration from file"""
        config_path = Path.home() / ".echoctl" / "config.json"
        
        if config_path.exists():
            with open(config_path) as f:
                data = json.load(f)
            return cls(**data)
        
        return cls()
    
    def save(self) -> None:
        """Save configuration to file"""
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # Exclude fields that shouldn't be persisted
        data = self.model_dump(
            exclude={"config_dir", "config_file"},
            exclude_none=True,
        )
        
        with open(self.config_file, "w") as f:
            json.dump(data, f, indent=2)
    
    def set_value(self, key: str, value: str) -> None:
        """Set a configuration value"""
        # Map string keys to field names
        key_map = {
            "backend-url": "backend_url",
            "backend_url": "backend_url",
            "api-key": "api_key",
            "api_key": "api_key",
            "gemini-api-key": "gemini_api_key",
            "gemini_api_key": "gemini_api_key",
            "openai-api-key": "openai_api_key",
            "openai_api_key": "openai_api_key",
            "anthropic-api-key": "anthropic_api_key",
            "anthropic_api_key": "anthropic_api_key",
            "provider": "provider",
            "default-agent": "default_agent",
            "default_agent": "default_agent",
            "max-depth": "max_depth",
            "max_depth": "max_depth",
            "timeout": "timeout",
            "use-colors": "use_colors",
            "use_colors": "use_colors",
        }

        field_name = key_map.get(key, key)

        if field_name not in self.model_fields:
            raise ValueError(f"Unknown configuration key: {key}")

        # Type conversion
        field_type = self.model_fields[field_name].annotation
        if field_type == bool:
            value = value.lower() in {"true", "1", "yes", "on"}
        elif field_type == int:
            value = int(value)
        elif field_type == float:
            value = float(value)

        setattr(self, field_name, value)
        self.save()
    
    def get_value(self, key: str) -> Optional[str]:
        """Get a configuration value as string"""
        key_map = {
            "backend-url": "backend_url",
            "backend_url": "backend_url",
            "api-key": "api_key",
            "api_key": "api_key",
            "gemini-api-key": "gemini_api_key",
            "gemini_api_key": "gemini_api_key",
            "openai-api-key": "openai_api_key",
            "openai_api_key": "openai_api_key",
            "anthropic-api-key": "anthropic_api_key",
            "anthropic_api_key": "anthropic_api_key",
            "provider": "provider",
            "default-agent": "default_agent",
            "default_agent": "default_agent",
            "max-depth": "max_depth",
            "max_depth": "max_depth",
            "timeout": "timeout",
            "use-colors": "use_colors",
            "use_colors": "use_colors",
        }
        
        field_name = key_map.get(key, key)
        
        if field_name not in self.model_fields:
            return None
        
        value = getattr(self, field_name)
        if isinstance(value, bool):
            return "true" if value else "false"
        return str(value) if value is not None else None
    
    def show_all(self) -> dict:
        """Show all configuration values"""
        return self.model_dump(
            exclude_none=True,
            exclude={"config_dir", "config_file"},
        )
    
    def export(self) -> str:
        """Export configuration as JSON string"""
        return json.dumps(self.show_all(), indent=2)
    
    def import_config(self, config_json: str) -> None:
        """Import configuration from JSON string"""
        data = json.loads(config_json)
        
        for key, value in data.items():
            if key in self.model_fields:
                setattr(self, key, value)
        
        self.save()


# Global config instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get or create global config instance"""
    global _config
    if _config is None:
        _config = Config.load()
    return _config
