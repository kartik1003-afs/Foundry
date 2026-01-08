import faiss
import numpy as np
import os
import json
from app.db.fake_db import get_all_items

DIM = 512
INDEX_PATH = "./data/faiss_index.index"
ID_MAP_PATH = "./data/id_map.json"

# Ensure data directory exists
os.makedirs("./data", exist_ok=True)

# Initialize or load FAISS index
def get_index():
    if os.path.exists(INDEX_PATH):
        print(f"Loading FAISS index from {INDEX_PATH}")
        index = faiss.read_index(INDEX_PATH)
    else:
        print(f"Creating new FAISS index")
        index = faiss.IndexFlatIP(DIM)
    return index

# Initialize or load ID map
def get_id_map():
    if os.path.exists(ID_MAP_PATH):
        print(f"Loading ID map from {ID_MAP_PATH}")
        with open(ID_MAP_PATH, 'r') as f:
            return json.load(f)
    else:
        print(f"Creating new ID map")
        return []

# Global variables
index = get_index()
id_map = get_id_map()

def save_index():
    """Save FAISS index and ID map to disk"""
    print(f"Saving FAISS index to {INDEX_PATH}")
    faiss.write_index(index, INDEX_PATH)
    
    print(f"Saving ID map to {ID_MAP_PATH}")
    with open(ID_MAP_PATH, 'w') as f:
        json.dump(id_map, f, indent=2)

def sync_with_database():
    """Sync FAISS index with MongoDB items"""
    print("Syncing FAISS index with database...")
    
    try:
        # Get all items from database
        db_items = get_all_items()
        print(f"Found {len(db_items)} items in database")
        
        # Create new index and ID map
        global index, id_map
        new_index = faiss.IndexFlatIP(DIM)
        new_id_map = []
        
        # Add all items from database to index
        for item in db_items:
            if 'embedding' in item and item['embedding']:
                try:
                    vector = np.array(item['embedding']).astype("float32")
                    new_index.add(vector)
                    new_id_map.append(item['item_id'])
                    print(f"Added item {item['item_id']} to index")
                except Exception as e:
                    print(f"Error adding item {item['item_id']}: {e}")
        
        # Replace global variables
        index = new_index
        id_map = new_id_map
        
        # Save to disk
        save_index()
        print(f"Sync complete: {len(new_id_map)} items in index")
        
    except Exception as e:
        print(f"Error syncing with database: {e}")

def add_vector(vector, item_id):
    """Add vector to FAISS index and save to disk"""
    global index, id_map
    
    vector = np.array([vector]).astype("float32")
    index.add(vector)
    id_map.append(item_id)
    
    # Save after each addition
    save_index()
    print(f"Added vector for {item_id}, total items: {len(id_map)}")

def search_vectors(query_vector, top_k):
    """Search vectors in FAISS index"""
    if index.ntotal == 0:
        print("FAISS index is empty")
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
    
    print(f"FAISS search returned {len(results)} results")
    return results

# Initialize sync with database on startup
print("Initializing FAISS index...")
sync_with_database()
