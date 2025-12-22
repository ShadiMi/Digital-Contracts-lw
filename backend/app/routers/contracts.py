from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from app.database import get_db
from app import models, schemas, auth

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", response_model=schemas.ContractResponse, status_code=status.HTTP_201_CREATED)
async def upload_contract(
    file: UploadFile = File(...),
    title: str = Form(...),
    recipient_username: str = Form(None),
    recipient_email: str = Form(None),
    notes: str = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not recipient_username and not recipient_email:
        raise HTTPException(status_code=400, detail="Either recipient_username or recipient_email is required")
    
    # Find recipient
    recipient = None
    if recipient_username:
        recipient = db.query(models.User).filter(models.User.username == recipient_username).first()
    if not recipient and recipient_email:
        recipient = db.query(models.User).filter(models.User.email == recipient_email).first()
    
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send contract to yourself")
    
    # Save file
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Create contract
    contract = models.Contract(
        title=title,
        file_path=str(file_path),
        file_name=file.filename,
        sender_id=current_user.id,
        recipient_id=recipient.id,
        notes=notes
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    # Create initial version
    version = models.ContractVersion(
        contract_id=contract.id,
        version_number=1,
        file_path=str(file_path),
        file_name=file.filename,
        created_by_id=current_user.id,
        change_notes="Initial version"
    )
    db.add(version)
    
    # Create notification for recipient
    notification = models.Notification(
        user_id=recipient.id,
        contract_id=contract.id,
        type="new_contract",
        message=f"New contract '{title}' from {current_user.username}"
    )
    db.add(notification)
    
    db.commit()
    
    # Reload with relationships
    contract = db.query(models.Contract).options(
        joinedload(models.Contract.sender),
        joinedload(models.Contract.recipient),
        joinedload(models.Contract.versions).joinedload(models.ContractVersion.created_by)
    ).filter(models.Contract.id == contract.id).first()
    return contract

@router.get("/", response_model=List[schemas.ContractResponse])
def get_my_contracts(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contracts = db.query(models.Contract).options(
        joinedload(models.Contract.sender),
        joinedload(models.Contract.recipient),
        joinedload(models.Contract.versions).joinedload(models.ContractVersion.created_by)
    ).filter(
        or_(
            models.Contract.sender_id == current_user.id,
            models.Contract.recipient_id == current_user.id
        )
    ).all()
    return contracts

@router.get("/{contract_id}", response_model=schemas.ContractResponse)
def get_contract(
    contract_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).options(
        joinedload(models.Contract.sender),
        joinedload(models.Contract.recipient),
        joinedload(models.Contract.versions).joinedload(models.ContractVersion.created_by)
    ).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.sender_id != current_user.id and contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this contract")
    
    return contract

@router.get("/{contract_id}/download")
def download_contract(
    contract_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.sender_id != current_user.id and contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this contract")
    
    if not os.path.exists(contract.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(contract.file_path, filename=contract.file_name)

@router.post("/{contract_id}/lock")
def lock_contract(
    contract_id: int,
    lock_request: schemas.ContractLockRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.sender_id != current_user.id and contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to lock this contract")
    
    if lock_request.action == "lock":
        # Check if already locked by someone else
        if contract.locked_by_id and contract.locked_by_id != current_user.id:
            raise HTTPException(
                status_code=409,
                detail=f"Contract is currently being edited by another user"
            )
        contract.locked_by_id = current_user.id
        contract.locked_at = datetime.utcnow()
    elif lock_request.action == "unlock":
        if contract.locked_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="You don't have a lock on this contract")
        contract.locked_by_id = None
        contract.locked_at = None
    else:
        raise HTTPException(status_code=400, detail="Action must be 'lock' or 'unlock'")
    
    db.commit()
    return {"message": f"Contract {lock_request.action}ed successfully"}

@router.post("/{contract_id}/sign")
def sign_contract(
    contract_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the recipient can sign the contract")
    
    if contract.status == schemas.ContractStatus.SIGNED:
        raise HTTPException(status_code=400, detail="Contract is already signed")
    
    if contract.status == schemas.ContractStatus.DENIED:
        raise HTTPException(status_code=400, detail="Cannot sign a denied contract")
    
    contract.status = schemas.ContractStatus.SIGNED
    contract.signed_at = datetime.utcnow()
    contract.locked_by_id = None
    contract.locked_at = None
    
    db.commit()
    return {"message": "Contract signed successfully"}

@router.post("/{contract_id}/deny")
def deny_contract(
    contract_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the recipient can deny the contract")
    
    contract.status = schemas.ContractStatus.DENIED
    contract.locked_by_id = None
    contract.locked_at = None
    
    db.commit()
    return {"message": "Contract denied successfully"}

@router.post("/{contract_id}/edit", response_model=schemas.ContractResponse)
async def edit_contract(
    contract_id: int,
    file: UploadFile = File(...),
    change_notes: str = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.sender_id != current_user.id and contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this contract")
    
    # Check if locked by someone else
    if contract.locked_by_id and contract.locked_by_id != current_user.id:
        raise HTTPException(
            status_code=409,
            detail="Contract is currently being edited by another user. Please try again later."
        )
    
    # Lock the contract for editing
    contract.locked_by_id = current_user.id
    contract.locked_at = datetime.utcnow()
    
    # Get next version number
    max_version = db.query(models.ContractVersion).filter(
        models.ContractVersion.contract_id == contract_id
    ).order_by(models.ContractVersion.version_number.desc()).first()
    
    next_version = (max_version.version_number + 1) if max_version else 1
    
    # Save new version of file
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update contract with new file
    contract.file_path = str(file_path)
    contract.file_name = file.filename
    contract.status = schemas.ContractStatus.EDITED
    contract.updated_at = datetime.utcnow()
    
    # Create new version
    version = models.ContractVersion(
        contract_id=contract.id,
        version_number=next_version,
        file_path=str(file_path),
        file_name=file.filename,
        created_by_id=current_user.id,
        change_notes=change_notes or f"Version {next_version} edited"
    )
    db.add(version)
    
    # Unlock contract after editing (as requested)
    contract.locked_by_id = None
    contract.locked_at = None
    
    # Create notification for the other user (sender or recipient)
    other_user_id = contract.recipient_id if current_user.id == contract.sender_id else contract.sender_id
    notification = models.Notification(
        user_id=other_user_id,
        contract_id=contract.id,
        type="contract_edited",
        message=f"Contract '{contract.title}' has been edited"
    )
    db.add(notification)
    
    db.commit()
    
    # Reload with relationships
    contract = db.query(models.Contract).options(
        joinedload(models.Contract.sender),
        joinedload(models.Contract.recipient),
        joinedload(models.Contract.versions).joinedload(models.ContractVersion.created_by)
    ).filter(models.Contract.id == contract.id).first()
    
    return contract

@router.get("/{contract_id}/versions", response_model=List[schemas.ContractVersionResponse])
def get_contract_versions(
    contract_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.sender_id != current_user.id and contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view versions of this contract")
    
    versions = db.query(models.ContractVersion).options(
        joinedload(models.ContractVersion.created_by)
    ).filter(
        models.ContractVersion.contract_id == contract_id
    ).order_by(models.ContractVersion.version_number.desc()).all()
    
    return versions

@router.get("/{contract_id}/versions/{version_id}/download")
def download_version(
    contract_id: int,
    version_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.sender_id != current_user.id and contract.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this version")
    
    version = db.query(models.ContractVersion).filter(
        models.ContractVersion.id == version_id,
        models.ContractVersion.contract_id == contract_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    if not os.path.exists(version.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(version.file_path, filename=version.file_name)

