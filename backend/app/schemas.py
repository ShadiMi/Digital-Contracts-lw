from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models import ContractStatus

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ContractBase(BaseModel):
    title: str
    recipient_username: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    notes: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractVersionResponse(BaseModel):
    id: int
    contract_id: int
    version_number: int
    file_name: str
    created_by_id: int
    created_at: datetime
    change_notes: Optional[str]
    created_by: UserResponse
    
    class Config:
        from_attributes = True

class ContractResponse(BaseModel):
    id: int
    title: str
    file_name: str
    sender_id: int
    recipient_id: int
    status: ContractStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    signed_at: Optional[datetime]
    locked_by_id: Optional[int]
    locked_at: Optional[datetime]
    sender: UserResponse
    recipient: UserResponse
    versions: list[ContractVersionResponse] = []
    
    class Config:
        from_attributes = True

class ContractUpdate(BaseModel):
    status: Optional[ContractStatus] = None
    notes: Optional[str] = None

class ContractLockRequest(BaseModel):
    action: str  # "lock" or "unlock"

class ContractVersionCreate(BaseModel):
    change_notes: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    contract_id: int
    type: str
    message: str
    is_read: int
    created_at: datetime
    
    class Config:
        from_attributes = True

