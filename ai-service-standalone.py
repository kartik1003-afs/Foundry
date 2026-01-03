from fastapi import FastAPI, Form
import uvicorn
import numpy as np
import faiss

# Simple in-memory FAISS index
DIM = 512
index = faiss.IndexFlatIP(DIM)
id_map = []

def add_vector(vector, item_id):
    vector = np.array([vector]).astype("float32")
    index.add(vector)
    id_map.append(item_id)

def search_vectors(query_vector, top_k):
    if index.ntotal == 0:
        return []
    
    query_vector = np.array([query_vector]).astype("float32")
    scores, indices = index.search(query_vector, top_k)
    
    results = []
    for idx, score in zip(indices[0], scores[0]):
        if idx < len(id_map):
            results.append({
                "item_id": id_map[idx],
                "score": float(score)
            })
    
    return results

def confidence_label(score):
    if score >= 0.75:
        return "High"
    elif score >= 0.5:
        return "Medium"
    else:
        return "Low"

def find_matches(query_embedding, top_k, report_type=None):
    try:
        raw_results = search_vectors(query_embedding, top_k)
        print(f"Raw results from search: {raw_results}")

        final_results = []
        for r in raw_results:
            print(f"Processing result: {r}")
            if isinstance(r, dict) and r["score"] >= 0.3:
                # If report_type is specified, only return matches of opposite type
                if report_type is None:
                    final_results.append({
                        "item_id": r["item_id"],
                        "score": round(r["score"],3),
                        "confidence": confidence_label(r["score"]),
                        "reason": "Image and description are semantically similar"
                    })
                else:
                    # For lost items, only return found items
                    # For found items, only return lost items
                    item_id = r["item_id"]
                    item_type = item_id.split('-')[0]  # Extract LOST or FOUND from ID
                    
                    if (report_type == "lost" and item_type == "FOUND") or \
                       (report_type == "found" and item_type == "LOST"):
                        print(f"Adding match: {item_id}")
                        final_results.append({
                            "item_id": r["item_id"],
                            "score": round(r["score"],3),
                            "confidence": confidence_label(r["score"]),
                            "reason": "Image and description are semantically similar"
                        })
                    else:
                        print(f"Skipping match: {item_id} (report_type={report_type}, item_type={item_type})")

        return final_results
    except Exception as e:
        print(f"Error in find_matches: {e}")
        return []

# Mock data for testing
mock_found_items = [
    {
        "item_id": "FOUND-KEYS-TEST",
        "itemType": "key",
        "description": "A small silver key with a red keychain",
        "location": "Library - 2nd floor",
        "reportType": "found",
        "imageUrl": "https://res.cloudinary.com/dpwoayuwx/image/upload/v1767422204/found-items/wtnwtwuwzduyckxlnpkb.webp",
        "vector": np.random.rand(DIM).astype("float32")
    }
]

# Add mock found items to index
for item in mock_found_items:
    add_vector(item["vector"], item["item_id"])

app = FastAPI(title="Lost & Found AI System")

@app.post("/report")
def report_item(
    image_url: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    category: str = Form("general"),
    report_type: str = Form(...)
):
    # Mock embedding (in real app, this would use CLIP)
    query_embedding = np.random.rand(DIM).astype("float32")
    
    if report_type == "lost":
        # For lost items, find similar found items
        matches = find_matches(query_embedding, 5, report_type="found")
        
        return {
            "status": "success",
            "message": "Lost item reported successfully",
            "item_id": f"LOST-{category.upper()}-TEST",
            "matches": matches
        }

    elif report_type == "found":
        # For found items, just store them
        return {
            "status": "success", 
            "message": "Found item reported successfully",
            "item_id": f"FOUND-{category.upper()}-TEST"
        }

    return {"error": "Invalid report_type (use 'lost' or 'found')"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
