"""echoctl - CLI Agent for ECHOMEN

Your thoughts. My echo. In the terminal.
"""

import sys
from pathlib import Path

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from echoctl import __version__
from echoctl.pkg.config import Config, get_config
from echoctl.pkg.api.client import SyncEchoMenClient, StatusResponse

# Initialize Rich console
console = Console()

# Create main Typer app
app = typer.Typer(
    name="echoctl",
    help="CLI Agent for ECHOMEN - Your thoughts. My echo. In the terminal.",
    add_completion=True,
)


def version_callback(value: bool):
    """Show version and exit"""
    if value:
        console.print(f"[bold blue]echoctl[/bold blue] version [green]{__version__}[/green]")
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        False,
        "--version",
        "-v",
        callback=version_callback,
        is_eager=True,
        help="Show version and exit",
    ),
):
    """echoctl - CLI Agent for ECHOMEN"""
    pass


# ============================================================================
# CONFIG COMMANDS
# ============================================================================

config_app = typer.Typer(name="config", help="Manage configuration")
app.add_typer(config_app)


@config_app.command("show")
def config_show():
    """Show all configuration values"""
    config = get_config()
    
    table = Table(title="echoctl Configuration", show_header=True)
    table.add_column("Key", style="cyan")
    table.add_column("Value", style="green")
    
    for key, value in config.show_all().items():
        if "api_key" in key and value:
            # Mask API keys for display
            value = f"{value[:4]}...{value[-4:]}" if len(value) > 8 else "***"
        table.add_row(key, str(value))
    
    console.print(table)


@config_app.command("get")
def config_get(key: str = typer.Argument(..., help="Configuration key")):
    """Get a configuration value"""
    config = get_config()
    value = config.get_value(key)
    
    if value is None:
        console.print(f"[red]Unknown configuration key:[/red] {key}")
        raise typer.Exit(1)
    
    console.print(value)


@config_app.command("set")
def config_set(
    key: str = typer.Argument(..., help="Configuration key"),
    value: str = typer.Argument(..., help="Configuration value"),
):
    """Set a configuration value"""
    config = get_config()

    try:
        config.set_value(key, value)
        console.print(f"[green]✓[/green] Set [bold]{key}[/bold] = [green]{value}[/green]")
    except ValueError as e:
        console.print(f"[red]Error:[/red] {e}")
        raise typer.Exit(1) from e


@config_app.command("export")
def config_export(
    output: str = typer.Option(
        None,
        "--output",
        "-o",
        help="Output file path (default: stdout)",
    ),
):
    """Export configuration to JSON"""
    config = get_config()
    
    if output:
        with open(output, "w") as f:
            f.write(config.export())
        console.print(f"[green]✓[/green] Configuration exported to [bold]{output}[/bold]")
    else:
        console.print(config.export())


@config_app.command("import")
def config_import(
    input_file: str = typer.Argument(..., help="Configuration file to import"),
):
    """Import configuration from JSON"""
    config = get_config()

    try:
        config_json = Path(input_file).read_text()
        config.import_config(config_json)
        console.print(f"[green]✓[/green] Configuration imported from [bold]{input_file}[/bold]")
    except Exception as e:
        console.print(f"[red]Error importing configuration:[/red] {e}")
        raise typer.Exit(1) from e


# ============================================================================
# AGENT COMMANDS
# ============================================================================

agent_app = typer.Typer(name="agent", help="Run and manage AI agents")
app.add_typer(agent_app)


@agent_app.command("run")
def agent_run(
    task: str = typer.Argument(..., help="Task description for the agent"),
    agent_type: str = typer.Option(
        "god",
        "--agent",
        "-a",
        help="Agent type: god, web, code, specialist",
    ),
    depth: int = typer.Option(
        1,
        "--depth",
        "-d",
        min=1,
        max=3,
        help="Maximum agent recursion depth (1-3)",
    ),
    watch: bool = typer.Option(
        False,
        "--watch",
        "-w",
        help="Watch real-time execution",
    ),
):
    """Run an AI agent task"""
    config = get_config()
    client = SyncEchoMenClient(
        base_url=config.backend_url,
        api_key=config.api_key,
        timeout=config.timeout,
    )
    
    console.print(
        Panel(
            f"[bold]{task}[/bold]\n\n"
            f"[dim]Agent: {agent_type} | Depth: {depth}[/dim]",
            title="[bold blue]🤖 Starting Agent Task[/bold blue]",
            border_style="blue",
        )
    )
    
    # Check backend health first
    if not client.health_check():
        console.print(
            "[red]✗[/red] Backend is not reachable at "
            f"[bold]{config.backend_url}[/bold]\n"
            "[dim]Make sure ECHOMEN backend is running on port 3001[/dim]"
        )
        raise typer.Exit(1)
    
    console.print("[green]✓[/green] Backend healthy, starting task...")
    
    # Fetch CSRF token
    client.fetch_csrf_token()
    
    # Run the agent task
    with console.status("[bold green]Agent is thinking...", spinner="dots"):
        response = client.run_agent(
            task=task,
            agent_type=agent_type,
            depth=depth,
            watch=watch,
        )
    
    if response.error:
        console.print(f"[red]✗ Error:[/red] {response.error}")
        raise typer.Exit(1)
    
    console.print(
        Panel(
            f"[bold]Task ID:[/bold] {response.task_id}\n"
            f"[bold]Status:[/bold] {response.status}\n"
            f"[bold]Tokens Used:[/bold] {response.tokens_used}\n\n"
            f"{response.result or 'Task completed. Check artifacts for output.'}",
            title="[bold green]✓ Task Complete[/bold green]",
            border_style="green",
        )
    )
    
    if response.artifacts:
        console.print("\n[bold]Artifacts created:[/bold]")
        for artifact in response.artifacts:
            console.print(f"  • {artifact}")


@agent_app.command("status")
def agent_status():
    """Show agent execution status"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    status = client.get_status()
    
    if not status.healthy:
        console.print("[red]✗ Backend is not healthy[/red]")
        raise typer.Exit(1)
    
    table = Table(title="ECHOMEN Backend Status", show_header=False)
    table.add_column("Property", style="cyan")
    table.add_column("Value", style="green")
    
    table.add_row("Status", "[green]● Healthy[/green]")
    table.add_row("Version", status.version)
    table.add_row("Active Agents", str(status.active_agents))
    table.add_row("Pending Approvals", str(status.pending_approvals))
    
    if status.token_usage:
        table.add_row("", "")
        table.add_row("[bold]Token Usage[/bold]", "")
        for provider, count in status.token_usage.items():
            table.add_row(f"  {provider}", str(count))
    
    console.print(table)


# ============================================================================
# BRAIN COMMANDS
# ============================================================================

brain_app = typer.Typer(name="brain", help="Manage knowledge base (Second Brain)")
app.add_typer(brain_app)


@brain_app.command("save")
def brain_save(
    key: str = typer.Argument(..., help="Memory key"),
    value: str = typer.Argument(..., help="Memory value"),
    tags: list[str] = typer.Option(
        [],
        "--tag",
        "-t",
        help="Tags for the memory item",
    ),
):
    """Save a memory item"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    response = client.save_memory(key=key, value=value, tags=tags)
    
    if response.success:
        console.print(
            f"[green]✓[/green] Saved memory [bold]{key}[/bold]\n"
            f"[dim]Tags: {', '.join(tags) if tags else 'none'}[/dim]"
        )
    else:
        console.print(f"[red]✗ Error:[/red] {response.error}")
        raise typer.Exit(1)


@brain_app.command("get")
def brain_get(
    key: str = typer.Argument(..., help="Memory key to retrieve"),
):
    """Retrieve a memory by key"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    response = client.retrieve_memory(key=key)
    
    if response.success and response.value:
        console.print(
            Panel(
                f"[bold]Key:[/bold] {response.key}\n"
                f"[bold]Tags:[/bold] {', '.join(response.tags) if response.tags else 'none'}\n\n"
                f"{response.value}",
                title="[bold blue]🧠 Memory Retrieved[/bold blue]",
                border_style="blue",
            )
        )
    else:
        console.print(f"[yellow]⚠ Memory not found:[/yellow] {key}")


@brain_app.command("search")
def brain_search(
    query: str = typer.Argument(..., help="Search query"),
    tags: list[str] = typer.Option(
        [],
        "--tag",
        "-t",
        help="Filter by tags",
    ),
):
    """Search memory"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    if tags:
        response = client.retrieve_memory(tags=tags)
        results = [{"key": response.key, "value": response.value, "tags": response.tags}]
    else:
        results = client.search_memory(query)
    
    if not results:
        console.print("[yellow]⚠ No results found[/yellow]")
        return
    
    console.print(f"[bold]Found {len(results)} result(s):[/bold]\n")
    
    for result in results:
        key = result.get("key", "unknown")
        value = result.get("value", "")
        tags_str = ", ".join(result.get("tags", []))
        
        console.print(
            Panel(
                f"[bold]Key:[/bold] {key}\n"
                f"[bold]Tags:[/bold] {tags_str or 'none'}\n\n"
                f"{value[:500]}{'...' if len(value) > 500 else ''}",
                title=f"🧠 {key}",
                border_style="blue",
            )
        )


@brain_app.command("delete")
def brain_delete(
    key: str = typer.Argument(..., help="Memory key to delete"),
    force: bool = typer.Option(
        False,
        "--force",
        "-f",
        help="Skip confirmation",
    ),
):
    """Delete a memory item"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    if not force:
        confirm = typer.confirm(f"Are you sure you want to delete memory '{key}'?")
        if not confirm:
            console.print("[yellow]Cancelled[/yellow]")
            raise typer.Exit(0)
    
    response = client.delete_memory(key=key)
    
    if response.success:
        console.print(f"[green]✓[/green] Deleted memory [bold]{key}[/bold]")
    else:
        console.print(f"[red]✗ Error:[/red] {response.error}")
        raise typer.Exit(1)


@brain_app.command("list")
def brain_list():
    """List all memories"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    # Search with empty query to get all
    results = client.search_memory("")
    
    if not results:
        console.print("[yellow]⚠ No memories found[/yellow]")
        return
    
    table = Table(title="🧠 Memory Index", show_header=True)
    table.add_column("Key", style="cyan")
    table.add_column("Tags", style="green")
    table.add_column("Preview", style="dim")
    
    for result in results:
        key = result.get("key", "unknown")
        value = result.get("value", "")
        tags_str = ", ".join(result.get("tags", []))
        preview = value[:50].replace("\n", " ") + "..." if len(value) > 50 else value
        
        table.add_row(key, tags_str, preview)
    
    console.print(table)


# ============================================================================
# STATUS COMMANDS
# ============================================================================

status_app = typer.Typer(name="status", help="View system status")
app.add_typer(status_app)


@status_app.command()
def status(
    brief: bool = typer.Option(
        False,
        "--brief",
        "-b",
        help="Show brief status",
    ),
    tokens: bool = typer.Option(
        False,
        "--tokens",
        "-t",
        help="Show token usage",
    ),
    agents: bool = typer.Option(
        False,
        "--agents",
        "-a",
        help="Show active agents",
    ),
):
    """Show system status"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    # Check backend health
    healthy = client.health_check()
    
    if brief:
        status_str = "[green]● Healthy[/green]" if healthy else "[red]✗ Unhealthy[/red]"
        console.print(f"ECHOMEN Backend: {status_str}")
        return
    
    if not healthy:
        console.print(
            Panel(
                f"Backend at [bold]{config.backend_url}[/bold] is not reachable.\n\n"
                "[dim]Make sure ECHOMEN backend is running:[/dim]\n"
                "[dim]  cd backend && npm start[/dim]",
                title="[bold red]✗ Backend Unhealthy[/bold red]",
                border_style="red",
            )
        )
        raise typer.Exit(1)
    
    status_response = client.get_status()
    
    # Main status panel
    console.print(
        Panel(
            f"[bold]Backend URL:[/bold] {config.backend_url}\n"
            f"[bold]Version:[/bold] {status_response.version}\n"
            f"[bold]Active Agents:[/bold] {status_response.active_agents}\n"
            f"[bold]Pending Approvals:[/bold] {status_response.pending_approvals}",
            title="[bold green]✓ ECHOMEN Backend Healthy[/bold green]",
            border_style="green",
        )
    )
    
    # Token usage
    if tokens or status_response.token_usage:
        console.print("\n[bold]Token Usage:[/bold]")
        table = Table(show_header=True)
        table.add_column("Provider", style="cyan")
        table.add_column("Tokens", style="green")
        
        for provider, count in status_response.token_usage.items():
            table.add_row(provider, str(count))
        
        console.print(table)
    
    # Active agents
    if agents:
        console.print("\n[bold]Active Agents:[/bold]")
        # This would need a real API endpoint to list active agents
        console.print("[dim]No active agents currently running[/dim]")


# ============================================================================
# APPROVE COMMANDS
# ============================================================================

approve_app = typer.Typer(name="approve", help="Manage HITL approvals")
app.add_typer(approve_app)


@approve_app.command("list")
def approve_list():
    """List pending approvals"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    approvals = client.get_pending_approvals()
    
    if not approvals:
        console.print("[green]✓[/green] No pending approvals")
        return
    
    table = Table(title="⚠ Pending Approvals", show_header=True)
    table.add_column("ID", style="cyan")
    table.add_column("Tool", style="yellow")
    table.add_column("Description", style="dim")
    table.add_column("Created", style="green")
    
    for approval in approvals:
        table.add_row(
            approval.approval_id,
            approval.tool_name,
            approval.description[:50],
            approval.created_at,
        )
    
    console.print(table)
    console.print("\n[dim]Use 'echoctl approve <ID> --yes/--no' to respond[/dim]")


@approve_app.command()
def approve(
    approval_id: str = typer.Argument(..., help="Approval ID"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Approve the request"),
    no: bool = typer.Option(False, "--no", "-n", help="Deny the request"),
):
    """Approve or deny a HITL request"""
    if not yes and not no:
        console.print("[red]✗[/red] Must specify --yes or --no")
        raise typer.Exit(1)

    approved = yes

    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)

    if success := client.submit_approval(approval_id, approved):
        action = "Approved" if approved else "Denied"
        console.print(f"[green]✓[/green] {action} request {approval_id}")
    else:
        console.print("[red]✗[/red] Failed to submit approval")
        raise typer.Exit(1)


@approve_app.command("config")
def approve_config(
    auto_approve: str = typer.Option(
        "",
        "--auto-approve",
        help="Comma-separated list of tools to auto-approve",
    ),
):
    """Configure auto-approval rules"""
    config = get_config()

    if auto_approve:
        tools = [t.strip() for t in auto_approve.split(",")]
        config.auto_approve_tools = tools
        config.save()
        console.print(f"[green]✓[/green] Auto-approve tools: {', '.join(tools)}")
    elif config.auto_approve_tools:
        console.print("[bold]Current auto-approve tools:[/bold]")
        for tool in config.auto_approve_tools:
            console.print(f"  • {tool}")
    else:
        console.print("[dim]No auto-approve tools configured[/dim]")


# ============================================================================
# WEB COMMANDS (WebHawk)
# ============================================================================

web_app = typer.Typer(name="web", help="WebHawk browser automation")
app.add_typer(web_app)


@web_app.command("navigate")
def web_navigate(
    url: str = typer.Argument(..., help="URL to navigate to"),
    extract: str = typer.Option(
        None,
        "--extract",
        "-e",
        help="Extract specific data from page",
    ),
):
    """Navigate to a URL"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    console.print(f"[dim]Navigating to:[/dim] [bold]{url}[/bold]")
    
    result = client.navigate_url(url)
    
    if "error" in result:
        console.print(f"[red]✗ Error:[/red] {result['error']}")
        raise typer.Exit(1)
    
    console.print(
        Panel(
            f"[bold]URL:[/bold] {result.get('url', url)}\n"
            f"[bold]Title:[/bold] {result.get('title', 'Unknown')}",
            title="[bold blue]🌐 Navigation Complete[/bold blue]",
            border_style="blue",
        )
    )


@web_app.command("screenshot")
def web_screenshot(
    output: str = typer.Option(
        "screenshot.png",
        "--output",
        "-o",
        help="Output file path",
    ),
):
    """Take a screenshot of current page"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)

    console.print("[dim]Taking screenshot...[/dim]")

    result = client.take_screenshot()

    if "error" in result:
        console.print(f"[red]✗ Error:[/red] {result['error']}")
        raise typer.Exit(1)

    # Decode and save screenshot
    import base64

    if screenshot_data := result.get("screenshot", ""):
        with open(output, "wb") as f:
            f.write(base64.b64decode(screenshot_data))
        console.print(f"[green]✓[/green] Screenshot saved to [bold]{output}[/bold]")
    else:
        console.print("[red]✗ No screenshot data received[/red]")
        raise typer.Exit(1)


@web_app.command("axtree")
def web_axtree():
    """Get accessibility tree of current page"""
    config = get_config()
    client = SyncEchoMenClient(base_url=config.backend_url, api_key=config.api_key)
    
    # This would need a real API endpoint
    console.print("[dim]Getting accessibility tree...[/dim]")
    console.print("[yellow]⚠ Not yet implemented - requires backend endpoint[/yellow]")


# ============================================================================
# TRACK COMMANDS (Placeholder for future implementation)
# ============================================================================

track_app = typer.Typer(name="track", help="Manage development tracks")
app.add_typer(track_app)


@track_app.command("new")
def track_new(
    name: str = typer.Argument(..., help="Track name"),
):
    """Create a new development track"""
    console.print("[yellow]⚠ Track management coming soon[/yellow]")
    console.print(f"[dim]Would create track: {name}[/dim]")


@track_app.command("list")
def track_list():
    """List all tracks"""
    console.print("[yellow]⚠ Track management coming soon[/yellow]")


@track_app.command("switch")
def track_switch(
    track_id: str = typer.Argument(..., help="Track ID to switch to"),
):
    """Switch to a different track"""
    console.print("[yellow]⚠ Track management coming soon[/yellow]")


@track_app.command("status")
def track_status():
    """Show current track status"""
    console.print("[yellow]⚠ Track management coming soon[/yellow]")


@track_app.command("export")
def track_export(
    format: str = typer.Option(
        "zip",
        "--format",
        "-f",
        help="Export format (zip, json)",
    ),
):
    """Export track artifacts"""
    console.print("[yellow]⚠ Track management coming soon[/yellow]")


# ============================================================================
# ARTIFACT COMMANDS (Placeholder for future implementation)
# ============================================================================

artifact_app = typer.Typer(name="artifact", help="Manage artifacts")
app.add_typer(artifact_app)


@artifact_app.command("list")
def artifact_list():
    """List all artifacts"""
    console.print("[yellow]⚠ Artifact management coming soon[/yellow]")


@artifact_app.command("show")
def artifact_show(
    artifact_id: str = typer.Argument(..., help="Artifact ID"),
):
    """Show an artifact"""
    console.print("[yellow]⚠ Artifact management coming soon[/yellow]")


@artifact_app.command("export")
def artifact_export(
    artifact_id: str = typer.Argument(..., help="Artifact ID"),
    output: str = typer.Option(None, "--output", "-o", help="Output file path"),
):
    """Export an artifact"""
    console.print("[yellow]⚠ Artifact management coming soon[/yellow]")


# ============================================================================
# Entry point
# ============================================================================

if __name__ == "__main__":
    app()
