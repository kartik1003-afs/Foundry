from app.ai.faiss_index import search_vectors, add_vector
from app.config import SCORE_THRESHOLD
from app.db.fake_db import get_all_items, update_item_embedding

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
        
        # Get all items from database to fetch full details
        db_items = get_all_items()
        item_details = {item['item_id']: item for item in db_items}
        
        final_results = []
        for r in raw_results:
            print(f"Processing result: {r}")
            if isinstance(r, dict) and "score" in r and r["score"] >= SCORE_THRESHOLD:
                # If report_type is specified, only return matches of opposite type
                if report_type is None:
                    # Get full item details from database
                    item_detail = item_details.get(r["item_id"])
                    if item_detail:
                        final_results.append({
                            "item_id": r["item_id"],
                            "itemType": item_detail.get("itemType", ""),
                            "description": item_detail.get("description", ""),
                            "location": item_detail.get("location", ""),
                            "reportType": item_detail.get("reportType", ""),
                            "imageUrl": item_detail.get("imageUrl", ""),
                            "score": round(r["score"],3),
                            "confidence": confidence_label(r["score"]),
                            "reason": "Image and description are semantically similar"
                        })
                else:
                    # For lost items, only return found items
                    # For found items, only return lost items
                    item_id = r["item_id"]
                    item_type = item_id.split('-')[0]  # Extract LOST or FOUND from ID
                    print(f"Filtering: report_type={report_type}, item_id={item_id}, item_type={item_type}")
                    
                    if (report_type == "lost" and item_type == "FOUND") or \
                       (report_type == "found" and item_type == "LOST"):
                        print(f"Adding match: {item_id}")
                        # Get full item details from database
                        item_detail = item_details.get(r["item_id"])
                        if item_detail:
                            final_results.append({
                                "item_id": r["item_id"],
                                "itemType": item_detail.get("itemType", ""),
                                "description": item_detail.get("description", ""),
                                "location": item_detail.get("location", ""),
                                "reportType": item_detail.get("reportType", ""),
                                "imageUrl": item_detail.get("imageUrl", ""),
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

def store_embedding(item_id, embedding):
    """Store embedding in MongoDB for an item"""
    try:
        success = update_item_embedding(item_id, embedding)
        if success:
            print(f"Stored embedding for {item_id}")
        else:
            print(f"Failed to store embedding for {item_id}")
    except Exception as e:
        print(f"Error storing embedding for {item_id}: {e}")
