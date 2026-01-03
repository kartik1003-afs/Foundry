print("Testing AI service import...")
try:
    from app.ai.matcher import find_matches
    from app.config import SCORE_THRESHOLD
    print("AI service modules imported successfully")
    print(f"Score threshold: {SCORE_THRESHOLD}")
except Exception as e:
    print(f"Import error: {e}")
