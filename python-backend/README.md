# CoDei Python Backend

FastAPI backend with Fetch.ai uAgents for intelligent code analysis and Socratic tutoring.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
- Get Groq API key from: https://console.groq.com/
- Get Claude API key from: https://console.anthropic.com/

4. Run the server:
```bash
uvicorn main:app --reload
```

## API Endpoints

- `POST /api/code_update` - Send code to analyze and get Socratic questions

## Example Usage

```python
import requests

response = requests.post(
    "http://localhost:8000/api/code_update",
    json={
        "code": "def foo():\n    return x * 2",
        "context": "User is learning about scopes"
    }
)
print(response.json())
```

