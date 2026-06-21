from sentence_transformers import SentenceTransformer
from typing import List

class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            # Load lightweight MiniLM model
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        model = cls.get_model()
        embedding = model.encode(text)
        return embedding.tolist()
