"""Tracking event snapshots, independent of Home Assistant."""


def tracking_snapshot(data, reference):
    events = [event for event in data.get("tracking_events") or [] if isinstance(event, dict)]
    latest = max(events, key=lambda event: str(event.get("date") or ""), default={})
    return {
        "reference": reference,
        "status": data.get("status"),
        "latest_event": latest.get("status"),
        "date": latest.get("date"),
        "location": latest.get("location") or "",
        "message": latest.get("message") or "",
    }
