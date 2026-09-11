from datetime import datetime, timezone
import requests


def add_execution_event(
    state: dict,
    node: str,
    status: str,
    message: str,
    details: dict | None = None,
) -> list[dict]:
    trace = list(
        state.get("execution_trace", [])
    )

    event = {
        "node": node,
        "status": status,
        "message": message,
        "details": details or {},
        "timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    trace.append(event)

    callback_url = state.get("callback_url")
    if callback_url and isinstance(callback_url, str):
        try:
            headers = {}
            if state.get("callback_token"):
                headers["x-agent-callback-token"] = state["callback_token"]
            requests.post(
                callback_url,
                json={"event": event},
                headers=headers,
                timeout=3.0,
            )
        except Exception as err:
            print(f"[ExecutionTrace] Could not post event to callback: {err}")

    return trace
