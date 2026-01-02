from app.ai.faiss_index import search_vectors
from app.config import SCORE_THRESHOLD

def confidence_label(score):
    if score >= 0.75:
        return "High"
    elif score >= 0.5:
        return "Medium"
    else:
        return "Low"


def find_matches(query_embedding, top_k):
    raw_results = search_vectors(query_embedding, top_k)
    print(f"Raw results from search: {raw_results}")

    final_results = []
    for r in raw_results:
        print(f"Processing result: {r}")
        if isinstance(r, dict) and "score" in r and r["score"] >= SCORE_THRESHOLD:
            final_results.append({
                "item_id": r["item_id"],
                "score": round(r["score"], 3),
                "confidence": confidence_label(r["score"]),
                "reason": "Image and description are semantically similar"
            })

    return final_results
