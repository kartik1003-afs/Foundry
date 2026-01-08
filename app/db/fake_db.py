import os
import json
from datetime import datetime

# Local JSON file storage
DB_FILE = "./data/items.json"

def get_db():
    """Get items from local JSON file"""
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    else:
        return []

def save_db(items):
    """Save items to local JSON file"""
    os.makedirs("./data", exist_ok=True)
    with open(DB_FILE, 'w') as f:
        json.dump(items, f, indent=2, default=str)

def insert_item(item):
    """Insert item into local JSON storage"""
    items = get_db()
    
    # Add timestamp
    item['created_at'] = datetime.utcnow().isoformat()
    
    items.append(item)
    save_db(items)
    print(f"Inserted item {item.get('item_id', 'unknown')} into local storage")
    return len(items) - 1  # Return index as ID

def get_all_items():
    """Get all items from local JSON storage"""
    items = get_db()
    print(f"Retrieved {len(items)} items from local storage")
    return items

def get_item_by_id(item_id):
    """Get specific item by ID"""
    items = get_db()
    for item in items:
        if item.get('item_id') == item_id:
            return item
    return None

def update_item_embedding(item_id, embedding):
    """Update item with embedding vector"""
    items = get_db()
    
    for i, item in enumerate(items):
        if item.get('item_id') == item_id:
            items[i]['embedding'] = embedding.tolist() if hasattr(embedding, 'tolist') else embedding
            save_db(items)
            print(f"Updated embedding for item {item_id}")
            return True
    
    print(f"Item {item_id} not found for embedding update")
    return False
