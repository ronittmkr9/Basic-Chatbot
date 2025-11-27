from groq import Groq
from dotenv import load_dotenv
load_dotenv()
import os


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

if __name__ == "__main__":
    print("Chatbot (type 'bye' to exit)")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ["bye", "exit", "quit"]:
            print("Chatbot: Bye!")
            break
        reply = get_response(user_input)
        print("Chatbot:", reply)