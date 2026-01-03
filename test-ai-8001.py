import requests

# Test AI service on port 8001
url = "http://localhost:8001/report"

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

print("Testing AI service on port 8001...")
try:
    response = requests.post(url, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
