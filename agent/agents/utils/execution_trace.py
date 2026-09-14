from datetime import datetime, timezone
import threading
import requests


# Shared session for HTTP connection reuse (TCP keepalive)
_callback_session = requests.Session()


def _fire_and_forget_post(url: str, json_data: dict, headers: dict):
    """Post to callback URL without blocking the caller thread."""
    try:
        _callback_session.post(url, json=json_data, headers=headers, timeout=3.0)
    except Exception as err:
        print(f"[ExecutionTrace] Could not post event to callback: {err}")


def emit_trace_event(
    state: dict,
    node: str,
    status: str,
    message: str,
    details: dict | None = None,
) -> dict:
    """Create a trace event and post it to the callback URL (non-blocking)."""
    event = {
        "node": node,
        "status": status,
        "message": message,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    callback_url = state.get("callback_url")
    if callback_url and isinstance(callback_url, str):
        headers = {}
        if state.get("callback_token"):
            headers["x-agent-callback-token"] = state["callback_token"]

        # Fire-and-forget: don't block the agent thread
        thread = threading.Thread(
            target=_fire_and_forget_post,
            args=(callback_url, {"event": event}, headers),
            daemon=True,
        )
        thread.start()

    return event


def add_execution_event(
    state: dict,
    node: str,
    status: str,
    message: str,
    details: dict | None = None,
) -> list[dict]:
    """Append a trace event to the execution trace list."""
    trace = list(state.get("execution_trace", []))

    event = emit_trace_event(
        state=state,
        node=node,
        status=status,
        message=message,
        details=details,
    )

    trace.append(event)
    return trace
