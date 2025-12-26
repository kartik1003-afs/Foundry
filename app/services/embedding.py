from sentence_transformers import SentenceTransformer
import numpy as np
import os
import logging
from typing import List, Optional
import faiss
import json

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = None
        self.metadata = []
        self.index_path = "data/faiss_index"
        self.metadata_path = "data/metadata.json"
        self._initialize_index()

    def _initialize_index(self):
        """Initialize or load FAISS index and metadata."""
        os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
        
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'r') as f:
                    self.metadata = json.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = []

    def _save_index(self):
        """Save the FAISS index and metadata to disk."""
        faiss.write_index(self.index, self.index_path)
        with open(self.metadata_path, 'w') as f:
            json.dump(self.metadata, f)

    def get_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for a single text."""
        return self.model.encode([text])[0]

    def add_item(self, text: str, item_id: str, metadata: dict) -> int:
        """Add a new item to the index."""
        embedding = self.get_embedding(text)
        embedding = np.array([embedding]).astype('float32')
        
        if self.index.ntotal == 0:
            self.index = faiss.IndexFlatL2(embedding.shape[1])
            
        self.index.add(embedding)
        
        item_meta = {
            'id': item_id,
            'text': text,
            **metadata
        }
        self.metadata.append(item_meta)
        
        self._save_index()
        return len(self.metadata) - 1

    def search(self, query: str, top_k: int = 5, category: Optional[str] = None) -> List[dict]:
        """Search for similar items."""
        query_embedding = self.get_embedding(query)
        query_embedding = np.array([query_embedding]).astype('float32')
        
        distances, indices = self.index.search(query_embedding, k=min(top_k * 2, self.index.ntotal))
        
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx == -1 or idx >= len(self.metadata):
                continue
                
            item = self.metadata[idx]
            if category and item.get('category') != category:
                continue
                
            results.append({
                **item,
                'score': float(1 / (1 + distance))  # Convert distance to similarity score
            })
            
            if len(results) >= top_k:
                break
                
        return sorted(results, key=lambda x: x['score'], reverse=True)

    def get_item(self, item_id: str) -> Optional[dict]:
        """Get item by ID."""
        for item in self.metadata:
            if item.get('id') == item_id:
                return item
        return None
