from groq import Groq
from dotenv import load_dotenv

from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()
import os

app = Flask(__name__)
CORS(app)

key = os.getenv("API_KEY")
client = Groq(api_key=key)

conversation_history = []


def get_response(prompt):
  
    conversation_history.append({"role": "user", "content": prompt})
    response = client.chat.completions.create(
        model = "llama-3.1-8b-instant",
        messages = conversation_history
    )
    chatbot_reply = response.choices[0].message.content

    conversation_history.append({"role": "assistant", "content": chatbot_reply})

    return chatbot_reply

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message")
    reply = get_response(message)
    
    return jsonify({"reply": reply})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
    # print("Chatbot (type 'bye' to exit)")
    # while True:
    #     user_input = input("You: ")
    #     if user_input.lower() in ["bye", "exit", "quit"]:
    #         print("Chatbot: Bye!")
    #         break
    #     reply = get_response(user_input)
    #     print("Chatbot:", reply)
    
