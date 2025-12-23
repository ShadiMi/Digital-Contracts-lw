from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class ContractStatus(str, enum.Enum):
    PENDING = "pending"
    SIGNED = "signed"
    EDITED = "edited"
    DENIED = "denied"
    APPROVED = "approved"
    COMPLETE = "complete"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    sent_contracts = relationship("Contract", foreign_keys="Contract.sender_id", back_populates="sender")
    received_contracts = relationship("Contract", foreign_keys="Contract.recipient_id", back_populates="recipient")

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(ContractStatus), default=ContractStatus.PENDING, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    signed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Locking fields
    locked_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    
    # Approval tracking
    sender_approved = Column(Integer, default=0, nullable=False)  # 0 = not approved, 1 = approved
    recipient_approved = Column(Integer, default=0, nullable=False)  # 0 = not approved, 1 = approved
    
    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_contracts")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_contracts")
    locked_by = relationship("User", foreign_keys=[locked_by_id])
    versions = relationship("ContractVersion", back_populates="contract", cascade="all, delete-orphan", order_by="ContractVersion.version_number.desc()")


class ContractVersion(Base):
    __tablename__ = "contract_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    change_notes = Column(Text, nullable=True)
    
    # Relationships
    contract = relationship("Contract", back_populates="versions")
    created_by = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    type = Column(String, nullable=False)  # "new_contract", "contract_edited", "contract_signed", etc.
    message = Column(String, nullable=False)
    is_read = Column(Integer, default=0, nullable=False)  # 0 = unread, 1 = read
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    contract = relationship("Contract")

