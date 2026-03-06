"""Tests for echoctl configuration module"""

import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from echoctl.pkg.config.config import Config


class TestConfig:
    """Test configuration management"""
    
    def test_default_values(self):
        """Test default configuration values"""
        config = Config()
        
        assert config.backend_url == "http://localhost:3001"
        assert config.provider == "gemini"
        assert config.default_agent == "god"
        assert config.max_depth == 3
        assert config.timeout == 120.0
        assert config.use_colors is True
    
    def test_set_value_string(self):
        """Test setting string configuration values"""
        config = Config()
        
        config.set_value("provider", "openai")
        assert config.provider == "openai"
        
        config.set_value("backend_url", "http://custom:3001")
        assert config.backend_url == "http://custom:3001"
    
    def test_set_value_bool(self):
        """Test setting boolean configuration values"""
        config = Config()
        
        config.set_value("use_colors", "false")
        assert config.use_colors is False
        
        config.set_value("use_colors", "true")
        assert config.use_colors is True
    
    def test_set_value_int(self):
        """Test setting integer configuration values"""
        config = Config()
        
        config.set_value("max_depth", "2")
        assert config.max_depth == 2
    
    def test_set_value_float(self):
        """Test setting float configuration values"""
        config = Config()
        
        config.set_value("timeout", "60.5")
        assert config.timeout == 60.5
    
    def test_set_value_unknown_key(self):
        """Test setting unknown configuration key raises error"""
        config = Config()
        
        with pytest.raises(ValueError, match="Unknown configuration key"):
            config.set_value("nonexistent_key", "value")
    
    def test_get_value(self):
        """Test getting configuration values"""
        config = Config()
        config.provider = "anthropic"
        
        assert config.get_value("provider") == "anthropic"
        assert config.get_value("nonexistent") is None
    
    def test_get_value_bool(self):
        """Test getting boolean values as strings"""
        config = Config()
        config.use_colors = True
        
        assert config.get_value("use_colors") == "true"
        
        config.use_colors = False
        assert config.get_value("use_colors") == "false"
    
    def test_show_all(self):
        """Test showing all configuration values"""
        config = Config()
        config.provider = "openai"
        
        data = config.show_all()
        
        assert data["provider"] == "openai"
        assert "backend_url" in data
        assert "config_dir" not in data
        assert "config_file" not in data
    
    def test_export(self):
        """Test exporting configuration as JSON"""
        config = Config()
        config.provider = "openai"
        
        exported = config.export()
        data = json.loads(exported)
        
        assert data["provider"] == "openai"
    
    def test_import_config(self):
        """Test importing configuration from JSON"""
        config = Config()
        
        config_json = json.dumps({
            "provider": "anthropic",
            "max_depth": 2,
            "use_colors": False,
        })
        
        config.import_config(config_json)
        
        assert config.provider == "anthropic"
        assert config.max_depth == 2
        assert config.use_colors is False
    
    @patch("echoctl.pkg.config.config.Path.home")
    def test_load_from_file(self, mock_home, tmp_path):
        """Test loading configuration from file"""
        config_dir = tmp_path / ".echoctl"
        config_dir.mkdir()
        config_file = config_dir / "config.json"
        
        config_data = {
            "provider": "openai",
            "backend_url": "http://custom:3001",
        }
        
        config_file.write_text(json.dumps(config_data))
        mock_home.return_value = tmp_path
        
        config = Config.load()
        
        assert config.provider == "openai"
        assert config.backend_url == "http://custom:3001"
    
    @patch("echoctl.pkg.config.config.Path.home")
    def test_save_to_file(self, mock_home, tmp_path):
        """Test saving configuration to file"""
        mock_home.return_value = tmp_path
        
        config = Config()
        config.provider = "openai"
        config.save()
        
        config_file = tmp_path / ".echoctl" / "config.json"
        assert config_file.exists()
        
        data = json.loads(config_file.read_text())
        assert data["provider"] == "openai"
