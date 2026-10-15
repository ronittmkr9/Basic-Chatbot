from groq import Groq
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

key = os.getenv("API_KEY")
if not key:
    raise RuntimeError("API_KEY environment variable is not set")
client = Groq(api_key=key)

MODEL = "openai/gpt-oss-120b"
SYSTEM_PROMPT = {"role": "system", "content": "You are a helpful, concise AI assistant."}
MAX_HISTORY = 20
MAX_CHARS = 4000


def clean_history(history):
    """Accept only well-formed user/assistant messages from the client."""
    if not isinstance(history, list):
        return []
    out = []
    for m in history[-MAX_HISTORY:]:
        if (
            isinstance(m, dict)
            and m.get("role") in ("user", "assistant")
            and isinstance(m.get("content"), str)
        ):
            out.append({"role": m["role"], "content": m["content"][:MAX_CHARS]})
    return out


@app.route("/")
def health():
    return "ok"


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message")
    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Message is required."}), 400

    # Stateless: the browser owns the conversation, so users never share history
    messages = [SYSTEM_PROMPT] + clean_history(data.get("history")) + [
        {"role": "user", "content": message[:MAX_CHARS]}
    ]
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=1,
            max_completion_tokens=2048,
            top_p=1,
            reasoning_effort="medium",
            stream=False,  # the frontend expects one JSON reply, not a stream
            stop=None,
        )
        return jsonify({"reply": response.choices[0].message.content})
    except Exception:
        app.logger.exception("Groq request failed")
        return jsonify({"error": "The AI service had a problem. Please try again."}), 502


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5090)))
