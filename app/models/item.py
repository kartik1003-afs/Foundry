from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import uuid

class ItemBase(BaseModel):
    type: str  # 'lost' or 'found'
    category: str
    description: str
    location: str
    image_url: Optional[str] = None
    user_id: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    labels: List[str] = []
    colors: List[str] = []
    attributes: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_resolved: bool = False

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SearchQuery(BaseModel):
    text: str
    category: Optional[str] = None
    location: Optional[str] = None
    image: Optional[bytes] = None
