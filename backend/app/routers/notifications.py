from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import and_
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.get("/count")
def get_notification_count(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(models.Notification).filter(
        and_(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read == 0
        )
    ).count()
    return {"count": count}

@router.get("/", response_model=List[schemas.NotificationResponse])
def get_notifications(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get user notifications"""
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(limit).all()
    return notifications

@router.post("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = 1
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/read-all")
def mark_all_as_read(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    db.query(models.Notification).filter(
        and_(
            models.Notification.user_id == current_user.id,
            models.Notification.is_read == 0
        )
    ).update({models.Notification.is_read: 1})
    db.commit()
    return {"message": "All notifications marked as read"}


