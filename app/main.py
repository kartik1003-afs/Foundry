from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from .config import settings
from .models.item import Item, ItemCreate, SearchQuery
from .services.vision import VisionService
from .services.embedding import EmbeddingService
from .services.matching import MatchingService
import logging
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
vision_service = VisionService()
embedding_service = EmbeddingService(model_name=settings.EMBEDDING_MODEL)
matching_service = MatchingService(vision_service, embedding_service)

# Create FastAPI app
app = FastAPI(
    title="Lost & Found AI Backend",
    description="AI-powered backend for Lost & Found application",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints
@app.post("/api/items/", response_model=Item)
async def create_item(
    item: ItemCreate,
    image: Optional[UploadFile] = File(None)
):
    """Create a new lost or found item."""
    try:
        # Convert to Item model
        item_data = item.dict()
        item_data["id"] = str(uuid.uuid4())
        item_obj = Item(**item_data)
        
        # Process image if provided
        image_content = None
        if image:
            if not any(image.filename.lower().endswith(ext) for ext in settings.ALLOWED_EXTENSIONS):
                raise HTTPException(status_code=400, detail="File type not allowed")
            image_content = await image.read()
            
        # Process item
        result = await matching_service.process_item(item_obj, image_content)
        return result
        
    except Exception as e:
        logger.error(f"Error creating item: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/items/search", response_model=List[dict])
async def search_items(
    query: str,
    category: Optional[str] = None,
    location: Optional[str] = None,
    image: Optional[UploadFile] = File(None)
):
    """Search for lost or found items."""
    try:
        search_query = SearchQuery(
            text=query,
            category=category,
            location=location,
            image=await image.read() if image else None
        )
        results = await matching_service.search_items(search_query)
        return results
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/items/{item_id}", response_model=dict)
async def get_item(item_id: str):
    """Get item details by ID."""
    item = matching_service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
