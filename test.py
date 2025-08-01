import requests
import json

response = requests.post(
  url="https://openrouter.ai/api/v1/chat/completions",
  headers={
    "Authorization": "Bearer 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",
    "Content-Type": "application/json"
  },
  data=json.dumps({
    "model": "deepseek/deepseek-r1-0528:free",
    "messages": [
      {
        "role": "user",
        "content": "What is the meaning of life?"
      }
    ]
  })
)

print(response.status_code)
print(response.json())