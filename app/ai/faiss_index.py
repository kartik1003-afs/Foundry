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
    """Sync FAISS index with database items"""
    print("Syncing FAISS index with database...")
    
    try:
        # Get all items from database
        db_items = get_all_items()
        print(f"Found {len(db_items)} items in database")
        
        # Load existing index and ID map first
        global index, id_map
        current_index = get_index()
        current_id_map = get_id_map()
        
        print(f"Current index has {current_index.ntotal} items")
        print(f"Current ID map has {len(current_id_map)} items")
        
        # Check if we need to rebuild index
        db_item_ids = {item['item_id'] for item in db_items if 'item_id' in item}
        indexed_item_ids = set(current_id_map)
        
        # Find items that are in database but not in index
        missing_items = []
        for item in db_items:
            if item.get('item_id') not in indexed_item_ids and 'embedding' in item and item['embedding']:
                missing_items.append(item)
        
        print(f"Found {len(missing_items)} items not in index")
        
        # Only rebuild if there are missing items or index is empty
        if missing_items or current_index.ntotal == 0:
            if current_index.ntotal == 0:
                print("Index is empty, creating new index...")
                new_index = faiss.IndexFlatIP(DIM)
                new_id_map = []
            else:
                print("Adding missing items to existing index...")
                new_index = current_index
                new_id_map = current_id_map.copy()
            
            # Add missing items to index
            for item in missing_items:
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
        else:
            print("Index is already up to date")
        
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
    # Handle different FAISS return formats
    if len(indices.shape) == 1:
        # Single query results
        for idx, score in zip(indices, scores):
            if idx < len(id_map):
                results.append({
                    "item_id": id_map[idx],
                    "score": float(score)
                })
    else:
        # Multiple query results (shouldn't happen with single query)
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
