from fastapi import FastAPI, Form
from app.utils.id_generator import generate_item_id

from app.ai.clip_model import encode_image_url, encode_text
from app.ai.fusion import fuse_embeddings
from app.ai.faiss_index import add_vector
from app.ai.matcher import find_matches, store_embedding
from app.db.fake_db import insert_item
from app.config import TOP_K

app = FastAPI(title="Lost & Found AI System")


@app.post("/report")
def report_item(
    image_url: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    category: str = Form("general"),
    report_type: str = Form(...)
):
    # Auto-generate item ID
    item_id = generate_item_id(report_type, category)

    try:
        img_emb = encode_image_url(image_url)
    except ValueError as e:
        return {"error": str(e)}

    text_input = f"a photo of {description} at {location}"
    txt_emb = encode_text(text_input)

    # Adaptive fusion
    if len(description.strip()) < 5:
        final_emb = img_emb
    else:
        final_emb = fuse_embeddings(img_emb, txt_emb)

    if report_type == "lost":
        # For lost items, find similar found items to help user find their lost item
        matches = find_matches(final_emb, TOP_K, report_type="found")
        
        # Store the lost item in database with embedding
        insert_item({
            "item_id": item_id,
            "category": category,
            "location": location,
            "reportType": report_type,
            "imageUrl": image_url,
            "description": description,
            "embedding": final_emb.tolist() if hasattr(final_emb, 'tolist') else final_emb
        })

        # Store embedding in FAISS
        add_vector(final_emb, item_id)

        return {
            "status": "success",
            "message": "Lost item reported successfully",
            "item_id": item_id,
            "matches": matches
        }

    elif report_type == "found":
        # For found items, just store them to help others find their lost items
        # Store the found item in database with embedding
        insert_item({
            "item_id": item_id,
            "category": category,
            "location": location,
            "reportType": report_type,
            "imageUrl": image_url,
            "description": description,
            "embedding": final_emb.tolist() if hasattr(final_emb, 'tolist') else final_emb
        })

        # Store embedding in FAISS
        add_vector(final_emb, item_id)

        return {
            "status": "success",
            "message": "Found item reported successfully",
            "item_id": item_id
        }

    return {"error": "Invalid report_type (use 'lost' or 'found')"}