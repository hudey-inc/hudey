"""Notification API routes - list, count unread, mark read."""

from fastapi import APIRouter, Depends, HTTPException

from backend.auth.current_brand import get_current_brand
from backend.db.repositories.notification_repo import (
    list_notifications as repo_list,
    count_unread as repo_count_unread,
    mark_read as repo_mark_read,
    mark_all_read as repo_mark_all_read,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
@router.get("/")
def get_notifications(brand: dict = Depends(get_current_brand)):
    """List notifications for the authenticated brand, newest first."""
    return repo_list(brand["id"])


@router.get("/unread-count")
def unread_count(brand: dict = Depends(get_current_brand)):
    """Get count of unread notifications."""
    return {"count": repo_count_unread(brand["id"])}


@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: str, brand: dict = Depends(get_current_brand)):
    """Mark a single notification as read."""
    ok = repo_mark_read(notification_id, brand["id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True}


@router.put("/read-all")
def mark_all_notifications_read(brand: dict = Depends(get_current_brand)):
    """Mark all notifications as read for the authenticated brand."""
    repo_mark_all_read(brand["id"])
    return {"ok": True}
