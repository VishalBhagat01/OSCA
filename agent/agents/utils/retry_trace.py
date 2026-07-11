def add_retry_trace(
    state: dict,
    stage: str,
    error: str | None = None
) -> list[dict]:
    trace = list(state.get("retry_trace", []))

    trace.append(
        {
            "attempt": state.get("retry_count", 0),
            "stage": stage,
            "error": error,
        }
    )

    return trace