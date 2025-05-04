from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class MessageRequest(BaseModel):
    """Model for incoming message requests from Twilio"""
    Body: str = Field(..., description="The content of the message")
    From: str = Field(..., description="The phone number the message was sent from")
    To: Optional[str] = Field(None, description="The phone number the message was sent to")
    MessageSid: Optional[str] = Field(None, description="Twilio message SID")
    AccountSid: Optional[str] = Field(None, description="Twilio account SID")

    @validator('From')
    def validate_phone_number(cls, v):
        if not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        return v

class MessageResponse(BaseModel):
    """Model for outgoing message responses"""
    message: str = Field(..., description="The response message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_id: Optional[str] = Field(None, description="Message ID if available")

class EscalationRequest(BaseModel):
    """Model for escalation requests"""
    original_message: str = Field(..., description="The original message that needs escalation")
    from_number: str = Field(..., description="The phone number of the sender")
    importance_score: Optional[float] = Field(None, description="Score indicating message importance (0-1)")

    @validator('importance_score')
    def validate_importance_score(cls, v):
        if v is not None and (v < 0 or v > 1):
            raise ValueError('Importance score must be between 0 and 1')
        return v

    @validator('from_number')
    def validate_phone_number(cls, v):
        if not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        return v

class EscalationResponse(BaseModel):
    """Model for escalation responses"""
    message: str = Field(..., description="Status message of the escalation")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    escalation_id: Optional[str] = Field(None, description="Escalation ID if available")

class MessageLog(BaseModel):
    """Model for logging messages in the database"""
    id: Optional[int] = Field(None, description="Database ID")
    message_content: str = Field(..., description="The content of the message")
    from_number: str = Field(..., description="Sender's phone number")
    to_number: str = Field(..., description="Recipient's phone number")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    importance_score: Optional[float] = Field(None, description="Message importance score")
    was_escalated: bool = Field(False, description="Whether the message was escalated")
    response_content: Optional[str] = Field(None, description="Assistant's response content")
    message_sid: Optional[str] = Field(None, description="Twilio message SID")

class ClassificationResult(BaseModel):
    """Model for message classification results"""
    message_id: str = Field(..., description="ID of the classified message")
    importance_score: float = Field(..., description="Calculated importance score")
    confidence: float = Field(..., description="Confidence level of the classification")
    categories: List[str] = Field(default_factory=list, description="Detected message categories")
    timestamp: datetime = Field(default_factory=datetime.utcnow) 