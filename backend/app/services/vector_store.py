import os
import json
import math
import google.generativeai as genai
from app.config import settings
from typing import List, Dict, Any

def dot_product(v1: List[float], v2: List[float]) -> float:
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v: List[float]) -> float:
    return math.sqrt(sum(x * x for x in v))

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

class VectorStoreService:
    def __init__(self):
        self.db_path = os.path.join(settings.CHROMA_DB_DIR, "vector_store.json")
        self.documents = []
        self._load_db()

    def _load_db(self):
        if os.path.exists(self.db_path):
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
            except Exception as e:
                print(f"Failed to load vector database file: {e}")
                self.documents = []
        else:
            self.documents = []

    def _save_db(self):
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with open(self.db_path, "w", encoding="utf-8") as f:
                json.dump(self.documents, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Failed to save vector database file: {e}")

    def add_artifact_document(self, project_id: int, agent_type: str, title: str, content: str):
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Gemini API key not found. Skipping embedding generation.")
            # Store without embedding
            embedding = [0.0] * 768
        else:
            try:
                genai.configure(api_key=api_key)
                response = genai.embed_content(
                    model="models/text-embedding-004",
                    contents=content,
                    task_type="retrieval_document"
                )
                embedding = response['embedding']
            except Exception as e:
                print(f"Failed to generate embedding: {e}")
                embedding = [0.0] * 768

        # Remove previous version if exists
        self.documents = [
            doc for doc in self.documents 
            if not (doc["project_id"] == project_id and doc["agent_type"] == agent_type)
        ]

        self.documents.append({
            "project_id": project_id,
            "agent_type": agent_type,
            "title": title,
            "content": content,
            "embedding": embedding
        })
        self._save_db()

    def query_project_artifacts(self, project_id: int, query_text: str, n_results: int = 3) -> List[Dict[str, Any]]:
        api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Gemini API key not found. Returning empty query results.")
            return []

        try:
            genai.configure(api_key=api_key)
            response = genai.embed_content(
                model="models/text-embedding-004",
                contents=query_text,
                task_type="retrieval_query"
            )
            query_embedding = response['embedding']
        except Exception as e:
            print(f"Failed to generate query embedding: {e}")
            return []

        # Filter by project_id
        project_docs = [doc for doc in self.documents if doc["project_id"] == project_id]
        if not project_docs:
            return []

        # Calculate similarity scores
        scored_docs = []
        for doc in project_docs:
            sim = cosine_similarity(query_embedding, doc["embedding"])
            scored_docs.append((sim, doc))

        # Sort by similarity score descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)

        # Build output structure matching standard format
        output = []
        for sim, doc in scored_docs[:n_results]:
            output.append({
                "id": f"proj_{doc['project_id']}_{doc['agent_type']}",
                "content": doc["content"],
                "metadata": {
                    "project_id": doc["project_id"],
                    "agent_type": doc["agent_type"],
                    "title": doc["title"]
                },
                "distance": float(1.0 - sim)  # distance = 1 - similarity
            })
        return output

vector_store = VectorStoreService()
