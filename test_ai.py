import requests
import json

# Test AI service directly
url = "http://localhost:8000/report"

data = {
    "image_url": "https://res.cloudinary.com/dpwoayuwx/image/upload/v1767422204/found-items/wtnwtwuwzduyckxlnpkb.webp",
    "description": "small key",
    "location": "library", 
    "category": "keys",
    "report_type": "lost"
}

files = {
    "image_url": (None, data["image_url"]),
    "description": (None, data["description"]),
    "location": (None, data["location"]),
    "category": (None, data["category"]),
    "report_type": (None, data["report_type"])
}

print("Testing AI service...")
response = requests.post(url, files=files)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
