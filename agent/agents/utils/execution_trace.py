from datetime import datetime, timezone


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

    trace.append(
        {
            "node": node,
            "status": status,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now(
                timezone.utc
            ).isoformat(),
        }
    )

    return trace