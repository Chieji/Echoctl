"""Tests for echoctl API client module"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import asyncio

from echoctl.pkg.api.client import (
    EchoMenClient,
    SyncEchoMenClient,
    TaskResponse,
    MemoryResponse,
    ApprovalRequest,
    StatusResponse,
)


class TestTaskResponse:
    """Test TaskResponse dataclass"""
    
    def test_default_values(self):
        """Test default TaskResponse values"""
        response = TaskResponse(task_id="123", status="completed")
        
        assert response.task_id == "123"
        assert response.status == "completed"
        assert response.result is None
        assert response.error is None
        assert response.artifacts == []
        assert response.tokens_used == 0
    
    def test_with_values(self):
        """Test TaskResponse with all values"""
        response = TaskResponse(
            task_id="456",
            status="success",
            result="Task completed successfully",
            artifacts=["output.txt"],
            tokens_used=1500,
        )
        
        assert response.result == "Task completed successfully"
        assert response.artifacts == ["output.txt"]
        assert response.tokens_used == 1500


class TestMemoryResponse:
    """Test MemoryResponse dataclass"""
    
    def test_default_values(self):
        """Test default MemoryResponse values"""
        response = MemoryResponse(success=True)
        
        assert response.success is True
        assert response.key is None
        assert response.value is None
        assert response.tags == []
        assert response.error is None


class TestApprovalRequest:
    """Test ApprovalRequest dataclass"""
    
    def test_values(self):
        """Test ApprovalRequest values"""
        request = ApprovalRequest(
            approval_id="approval-123",
            tool_name="executeShellCommand",
            description="Run npm install",
            created_at="2024-01-01T00:00:00Z",
        )
        
        assert request.approval_id == "approval-123"
        assert request.tool_name == "executeShellCommand"


class TestStatusResponse:
    """Test StatusResponse dataclass"""
    
    def test_default_values(self):
        """Test default StatusResponse values"""
        response = StatusResponse(healthy=True, version="1.0.0")
        
        assert response.healthy is True
        assert response.version == "1.0.0"
        assert response.active_agents == 0
        assert response.pending_approvals == 0
        assert response.token_usage == {}


class TestEchoMenClient:
    """Test EchoMenClient async client"""
    
    @pytest.mark.asyncio
    async def test_init(self):
        """Test client initialization"""
        client = EchoMenClient(
            base_url="http://localhost:3001",
            api_key="test-key",
            timeout=60.0,
        )
        
        assert client.base_url == "http://localhost:3001"
        assert client.api_key == "test-key"
        assert client.timeout == 60.0
    
    @pytest.mark.asyncio
    async def test_fetch_csrf_token_success(self):
        """Test successful CSRF token fetch"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"token": "csrf-token-123"}
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            token = await client.fetch_csrf_token()
            
            assert token == "csrf-token-123"
            assert client._csrf_token == "csrf-token-123"
    
    @pytest.mark.asyncio
    async def test_fetch_csrf_token_failure(self):
        """Test CSRF token fetch failure"""
        client = EchoMenClient()
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(side_effect=Exception("Connection error"))
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            token = await client.fetch_csrf_token()
            
            assert token is None
    
    @pytest.mark.asyncio
    async def test_health_check_success(self):
        """Test successful health check"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            healthy = await client.health_check()
            
            assert healthy is True
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self):
        """Test health check failure"""
        client = EchoMenClient()
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(side_effect=Exception("Connection error"))
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            healthy = await client.health_check()
            
            assert healthy is False
    
    @pytest.mark.asyncio
    async def test_get_status(self):
        """Test getting backend status"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "healthy": True,
            "version": "1.1.0",
            "active_agents": 2,
            "pending_approvals": 1,
            "token_usage": {"gemini": 1000, "openai": 500},
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            status = await client.get_status()
            
            assert status.healthy is True
            assert status.version == "1.1.0"
            assert status.active_agents == 2
            assert status.pending_approvals == 1
    
    @pytest.mark.asyncio
    async def test_run_agent_success(self):
        """Test running an agent task successfully"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "task_id": "task-123",
            "status": "completed",
            "result": "Task completed",
            "tokens_used": 1500,
            "artifacts": ["output.txt"],
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            response = await client.run_agent(
                task="Test task",
                agent_type="god",
                depth=1,
            )
            
            assert response.task_id == "task-123"
            assert response.status == "completed"
            assert response.result == "Task completed"
            assert response.tokens_used == 1500
    
    @pytest.mark.asyncio
    async def test_run_agent_error(self):
        """Test running an agent task with error"""
        client = EchoMenClient()
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=Exception("API error"))
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            response = await client.run_agent(task="Test task")
            
            assert response.status == "error"
            assert response.error == "API error"
    
    @pytest.mark.asyncio
    async def test_save_memory(self):
        """Test saving memory"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "key": "test-key",
            "tags": ["test"],
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            response = await client.save_memory(
                key="test-key",
                value="test-value",
                tags=["test"],
            )
            
            assert response.success is True
            assert response.key == "test-key"
    
    @pytest.mark.asyncio
    async def test_retrieve_memory(self):
        """Test retrieving memory by key"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "success": True,
            "key": "test-key",
            "value": "test-value",
            "tags": ["test"],
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            response = await client.retrieve_memory(key="test-key")
            
            assert response.success is True
            assert response.value == "test-value"
    
    @pytest.mark.asyncio
    async def test_search_memory(self):
        """Test searching memory"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [
                {"key": "key1", "value": "value1", "tags": ["tag1"]},
                {"key": "key2", "value": "value2", "tags": ["tag2"]},
            ]
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            results = await client.search_memory("query")
            
            assert len(results) == 2
            assert results[0]["key"] == "key1"
    
    @pytest.mark.asyncio
    async def test_delete_memory(self):
        """Test deleting memory"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"success": True}
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.delete = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            response = await client.delete_memory(key="test-key")
            
            assert response.success is True
    
    @pytest.mark.asyncio
    async def test_get_pending_approvals(self):
        """Test getting pending approvals"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "approvals": [
                {
                    "id": "approval-1",
                    "tool_name": "executeShellCommand",
                    "description": "Run command",
                    "created_at": "2024-01-01T00:00:00Z",
                }
            ]
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            approvals = await client.get_pending_approvals()
            
            assert len(approvals) == 1
            assert approvals[0].approval_id == "approval-1"
    
    @pytest.mark.asyncio
    async def test_submit_approval(self):
        """Test submitting approval"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            success = await client.submit_approval("approval-1", approved=True)
            
            assert success is True
    
    @pytest.mark.asyncio
    async def test_navigate_url(self):
        """Test navigating to URL"""
        client = EchoMenClient()
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "url": "https://example.com",
            "title": "Example Domain",
        }
        
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            result = await client.navigate_url("https://example.com")
            
            assert result["url"] == "https://example.com"
            assert result["title"] == "Example Domain"


class TestSyncEchoMenClient:
    """Test synchronous wrapper client"""
    
    def test_init(self):
        """Test sync client initialization"""
        client = SyncEchoMenClient(
            base_url="http://localhost:3001",
            api_key="test-key",
        )
        
        assert client._client.base_url == "http://localhost:3001"
        assert client._client.api_key == "test-key"
