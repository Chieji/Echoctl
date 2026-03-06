"""ECHOMEN Backend API Client"""

import asyncio
from typing import Any, Optional
from dataclasses import dataclass, field
import httpx


@dataclass
class TaskResponse:
    """Response from agent task execution"""
    task_id: str
    status: str
    result: Optional[str] = None
    error: Optional[str] = None
    artifacts: list[str] = field(default_factory=list)
    tokens_used: int = 0


@dataclass
class MemoryResponse:
    """Response from memory operations"""
    success: bool
    key: Optional[str] = None
    value: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    error: Optional[str] = None


@dataclass
class ApprovalRequest:
    """HITL approval request"""
    approval_id: str
    tool_name: str
    description: str
    created_at: str


@dataclass
class StatusResponse:
    """Backend status response"""
    healthy: bool
    version: str
    active_agents: int = 0
    pending_approvals: int = 0
    token_usage: dict[str, int] = field(default_factory=dict)


class EchoMenClient:
    """Client for communicating with ECHOMEN backend API"""
    
    def __init__(
        self,
        base_url: str = "http://localhost:3001",
        api_key: Optional[str] = None,
        timeout: float = 120.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self._csrf_token: Optional[str] = None
        self._session_id: Optional[str] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get configured HTTP client"""
        client = httpx.AsyncClient(timeout=self.timeout)
        
        if self.api_key:
            client.headers["Authorization"] = f"Bearer {self.api_key}"
        
        if self._session_id:
            client.headers["X-Session-ID"] = self._session_id
        
        if self._csrf_token:
            client.headers["X-CSRF-Token"] = self._csrf_token
        
        return client
    
    async def fetch_csrf_token(self) -> Optional[str]:
        """Fetch CSRF token from backend"""
        try:
            async with await self._get_client() as client:
                response = await client.get(f"{self.base_url}/api/csrf-token")
                response.raise_for_status()
                data = response.json()
                self._csrf_token = data.get("token")
                return self._csrf_token
        except Exception as e:
            print(f"Warning: Could not fetch CSRF token: {e}")
            return None
    
    def set_session_id(self, session_id: str) -> None:
        """Set session ID for requests"""
        self._session_id = session_id
    
    async def health_check(self) -> bool:
        """Check if backend is healthy"""
        try:
            async with await self._get_client() as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False
    
    async def get_status(self) -> StatusResponse:
        """Get backend status"""
        try:
            async with await self._get_client() as client:
                response = await client.get(f"{self.base_url}/api/status")
                response.raise_for_status()
                data = response.json()
                return StatusResponse(
                    healthy=data.get("healthy", True),
                    version=data.get("version", "unknown"),
                    active_agents=data.get("active_agents", 0),
                    pending_approvals=data.get("pending_approvals", 0),
                    token_usage=data.get("token_usage", {}),
                )
        except Exception as e:
            return StatusResponse(healthy=False, version="unknown", error=str(e))
    
    async def run_agent(
        self,
        task: str,
        agent_type: str = "god",
        depth: int = 1,
        watch: bool = False,
    ) -> TaskResponse:
        """Run an agent task"""
        try:
            async with await self._get_client() as client:
                payload = {
                    "task": task,
                    "agent_type": agent_type,
                    "max_depth": depth,
                }
                
                response = await client.post(
                    f"{self.base_url}/api/agent/run",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                
                return TaskResponse(
                    task_id=data.get("task_id", "unknown"),
                    status=data.get("status", "pending"),
                    result=data.get("result"),
                    error=data.get("error"),
                    artifacts=data.get("artifacts", []),
                    tokens_used=data.get("tokens_used", 0),
                )
        except httpx.HTTPStatusError as e:
            return TaskResponse(
                task_id="unknown",
                status="error",
                error=f"HTTP error: {e.response.status_code}",
            )
        except Exception as e:
            return TaskResponse(
                task_id="unknown",
                status="error",
                error=str(e),
            )
    
    async def save_memory(
        self,
        key: str,
        value: str,
        tags: Optional[list[str]] = None,
    ) -> MemoryResponse:
        """Save a memory item"""
        try:
            async with await self._get_client() as client:
                payload = {
                    "key": key,
                    "value": value,
                    "tags": tags or [],
                }
                
                response = await client.post(
                    f"{self.base_url}/api/memory/save",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                
                return MemoryResponse(
                    success=data.get("success", True),
                    key=data.get("key", key),
                    tags=data.get("tags", tags or []),
                )
        except Exception as e:
            return MemoryResponse(success=False, error=str(e))
    
    async def retrieve_memory(
        self,
        key: Optional[str] = None,
        tags: Optional[list[str]] = None,
    ) -> MemoryResponse:
        """Retrieve memory by key or tags"""
        try:
            async with await self._get_client() as client:
                params = {}
                if key:
                    params["key"] = key
                if tags:
                    params["tags"] = tags
                
                response = await client.get(
                    f"{self.base_url}/api/memory/retrieve",
                    params=params,
                )
                response.raise_for_status()
                data = response.json()
                
                return MemoryResponse(
                    success=data.get("success", True),
                    key=data.get("key"),
                    value=data.get("value"),
                    tags=data.get("tags", []),
                )
        except Exception as e:
            return MemoryResponse(success=False, error=str(e))
    
    async def search_memory(self, query: str) -> list[dict[str, Any]]:
        """Search memory by query"""
        try:
            async with await self._get_client() as client:
                response = await client.get(
                    f"{self.base_url}/api/memory/search",
                    params={"q": query},
                )
                response.raise_for_status()
                data = response.json()
                return data.get("results", [])
        except Exception:
            return []
    
    async def delete_memory(self, key: str) -> MemoryResponse:
        """Delete a memory item"""
        try:
            async with await self._get_client() as client:
                response = await client.delete(
                    f"{self.base_url}/api/memory/delete",
                    params={"key": key},
                )
                response.raise_for_status()
                data = response.json()
                
                return MemoryResponse(
                    success=data.get("success", True),
                    key=key,
                )
        except Exception as e:
            return MemoryResponse(success=False, error=str(e))
    
    async def get_pending_approvals(self) -> list[ApprovalRequest]:
        """Get pending HITL approvals"""
        try:
            async with await self._get_client() as client:
                response = await client.get(f"{self.base_url}/api/approvals/pending")
                response.raise_for_status()
                data = response.json()
                
                return [
                    ApprovalRequest(
                        approval_id=item.get("id", ""),
                        tool_name=item.get("tool_name", ""),
                        description=item.get("description", ""),
                        created_at=item.get("created_at", ""),
                    )
                    for item in data.get("approvals", [])
                ]
        except Exception:
            return []
    
    async def submit_approval(
        self,
        approval_id: str,
        approved: bool,
    ) -> bool:
        """Submit HITL approval decision"""
        try:
            async with await self._get_client() as client:
                payload = {"approved": approved}
                
                response = await client.post(
                    f"{self.base_url}/api/approvals/submit",
                    json=payload,
                    params={"approval_id": approval_id},
                )
                response.raise_for_status()
                return True
        except Exception:
            return False
    
    async def navigate_url(self, url: str) -> dict[str, Any]:
        """Navigate to a URL using WebHawk"""
        try:
            async with await self._get_client() as client:
                payload = {"url": url}
                
                response = await client.post(
                    f"{self.base_url}/api/browser/navigate",
                    json=payload,
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    async def take_screenshot(self) -> dict[str, Any]:
        """Take a screenshot of current browser page"""
        try:
            async with await self._get_client() as client:
                response = await client.post(f"{self.base_url}/api/browser/screenshot")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    async def close(self) -> None:
        """Cleanup client resources"""
        pass  # httpx.AsyncClient handles its own cleanup


# Sync wrapper for CLI usage
class SyncEchoMenClient:
    """Synchronous wrapper around async client for CLI usage"""
    
    def __init__(
        self,
        base_url: str = "http://localhost:3001",
        api_key: Optional[str] = None,
        timeout: float = 120.0,
    ):
        self._client = EchoMenClient(base_url, api_key, timeout)
    
    def fetch_csrf_token(self) -> Optional[str]:
        return asyncio.run(self._client.fetch_csrf_token())
    
    def set_session_id(self, session_id: str) -> None:
        self._client.set_session_id(session_id)
    
    def health_check(self) -> bool:
        return asyncio.run(self._client.health_check())
    
    def get_status(self) -> StatusResponse:
        return asyncio.run(self._client.get_status())
    
    def run_agent(
        self,
        task: str,
        agent_type: str = "god",
        depth: int = 1,
        watch: bool = False,
    ) -> TaskResponse:
        return asyncio.run(
            self._client.run_agent(task, agent_type, depth, watch)
        )
    
    def save_memory(
        self,
        key: str,
        value: str,
        tags: Optional[list[str]] = None,
    ) -> MemoryResponse:
        return asyncio.run(
            self._client.save_memory(key, value, tags)
        )
    
    def retrieve_memory(
        self,
        key: Optional[str] = None,
        tags: Optional[list[str]] = None,
    ) -> MemoryResponse:
        return asyncio.run(
            self._client.retrieve_memory(key, tags)
        )
    
    def search_memory(self, query: str) -> list[dict[str, Any]]:
        return asyncio.run(self._client.search_memory(query))
    
    def delete_memory(self, key: str) -> MemoryResponse:
        return asyncio.run(self._client.delete_memory(key))
    
    def get_pending_approvals(self) -> list[ApprovalRequest]:
        return asyncio.run(self._client.get_pending_approvals())
    
    def submit_approval(self, approval_id: str, approved: bool) -> bool:
        return asyncio.run(
            self._client.submit_approval(approval_id, approved)
        )
    
    def navigate_url(self, url: str) -> dict[str, Any]:
        return asyncio.run(self._client.navigate_url(url))
    
    def take_screenshot(self) -> dict[str, Any]:
        return asyncio.run(self._client.take_screenshot())
    
    def close(self) -> None:
        pass
