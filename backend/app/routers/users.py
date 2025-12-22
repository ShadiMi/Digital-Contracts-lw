from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

@router.get("/", response_model=List[schemas.UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/search")
def search_users(
    q: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Search users by username or email"""
    users = db.query(models.User).filter(
        (models.User.username.ilike(f"%{q}%")) | (models.User.email.ilike(f"%{q}%"))
    ).limit(10).all()
    
    return [{"id": u.id, "username": u.username, "email": u.email, "full_name": u.full_name} for u in users]

@router.get("/profile", response_model=schemas.UserResponse)
def get_profile(
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get current user profile"""
    return current_user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Check if email is being changed and if it's already taken
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_update.email
    
    # Update full name if provided
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    # Update password if provided
    if user_update.password:
        from app import auth as auth_module
        current_user.hashed_password = auth_module.get_password_hash(user_update.password)
    
    db.commit()
    db.refresh(current_user)
    return current_user

