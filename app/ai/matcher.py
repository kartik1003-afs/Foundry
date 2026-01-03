from app.ai.faiss_index import search_vectors
from app.config import SCORE_THRESHOLD

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
            if isinstance(r, dict) and "score" in r and r["score"] >= SCORE_THRESHOLD:
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
                    print(f"Filtering: report_type={report_type}, item_id={item_id}, item_type={item_type}")
                    
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
