import os
import sys
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Load env
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings

def test_model(model_name):
    print(f"Testing model: {model_name}...")
    try:
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.GEMINI_API_KEY,
            convert_system_message_to_human=True,
            temperature=0.2
        )
        res = llm.invoke("Say hello in one word.")
        print(f"SUCCESS: {model_name} returned: {res.content.strip()}")
        return True
    except Exception as e:
        print(f"FAILED: {model_name} failed with error: {e}")
        return False

def main():
    models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-2.0-flash-exp"]
    for m in models:
        test_model(m)

if __name__ == "__main__":
    main()
