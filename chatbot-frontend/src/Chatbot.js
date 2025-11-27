"use client"

import { useState, useRef, useEffect } from "react"
import axios from "axios"

const Chatbot = () => {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return

    // Add user message to chat
    const userMsg = { id: Date.now(), text: message, sender: "user", timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setMessage("")
    setLoading(true)

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/chat`, {
        message,
      })

      // Add AI response to chat
      const aiMsg = { id: Date.now() + 1, text: res.data.reply, sender: "ai", timestamp: new Date() }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error(err)
      const errorMsg = { id: Date.now() + 1, text: "Error connecting to backend.", sender: "ai", timestamp: new Date() }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div style={styles.container}>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>AI Assistant - Made by Ronit Tamrakar</h1>
          <p style={styles.subtitle}>Ready to help</p>
        </div>
      </div>

      {/* Messages Container */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h2 style={styles.emptyTitle}>Start a conversation</h2>
            <p style={styles.emptyText}>Ask me anything and I'll do my best to help.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{ ...styles.messageWrapper, justifyContent: msg.sender === "user" ? "flex-end" : "flex-start" }}
            >
              <div style={msg.sender === "user" ? styles.userMessage : styles.aiMessage}>
                <p style={msg.sender === "user" ? styles.userText : styles.aiText}>{msg.text}</p>
                <span style={styles.timestamp}>{formatTime(msg.timestamp)}</span>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div style={{ ...styles.messageWrapper, justifyContent: "flex-start" }}>
            <div style={styles.loadingMessage}>
              <div style={styles.loadingDot}></div>
              <div style={styles.loadingDot}></div>
              <div style={styles.loadingDot}></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div style={styles.inputContainer}>
        <div style={styles.inputWrapper}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            style={styles.input}
            rows="1"
          />
          <button onClick={sendMessage} disabled={loading || !message.trim()} style={styles.button}>
            <span style={styles.buttonText}>{loading ? "..." : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    background: "rgba(30, 41, 59, 0.8)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
    padding: "20px",
    textAlign: "center",
  },
  headerContent: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  title: {
    margin: "0 0 5px 0",
    fontSize: "24px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subtitle: {
    margin: "0",
    fontSize: "13px",
    color: "#94a3b8",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
  },
  emptyState: {
    textAlign: "center",
    color: "#94a3b8",
    paddingTop: "60px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "18px",
    fontWeight: "500",
    color: "#cbd5e1",
  },
  emptyText: {
    margin: "0",
    fontSize: "14px",
  },
  messageWrapper: {
    display: "flex",
    marginBottom: "4px",
  },
  userMessage: {
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    color: "#ffffff",
    padding: "12px 16px",
    borderRadius: "12px 12px 4px 12px",
    maxWidth: "70%",
    wordWrap: "break-word",
    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
  },
  aiMessage: {
    background: "rgba(100, 116, 139, 0.2)",
    color: "#e2e8f0",
    padding: "12px 16px",
    borderRadius: "12px 12px 12px 4px",
    maxWidth: "70%",
    wordWrap: "break-word",
    border: "1px solid rgba(148, 163, 184, 0.15)",
  },
  userText: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  aiText: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    lineHeight: "1.4",
  },
  timestamp: {
    fontSize: "11px",
    opacity: "0.7",
    display: "block",
  },
  loadingMessage: {
    display: "flex",
    gap: "4px",
    padding: "12px 16px",
  },
  loadingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#a78bfa",
    animation: "pulse 1.4s infinite",
  },
  inputContainer: {
    background: "rgba(30, 41, 59, 0.8)",
    borderTop: "1px solid rgba(148, 163, 184, 0.1)",
    padding: "20px",
    backdropFilter: "blur(10px)",
  },
  inputWrapper: {
    display: "flex",
    gap: "12px",
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
  },
  input: {
    flex: 1,
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "8px",
    color: "#e2e8f0",
    padding: "12px 16px",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    resize: "none",
    maxHeight: "120px",
    transition: "all 0.3s ease",
    ":focus": {
      borderColor: "rgba(167, 139, 250, 0.5)",
    },
  },
  button: {
    background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "80px",
    boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)",
  },
  buttonText: {
    margin: "0",
  },
}

// Add keyframe animation via style tag
const styleSheet = document.createElement("style")
styleSheet.textContent = `
  @keyframes pulse {
    0%, 60%, 100% { opacity: 0.3; }
    30% { opacity: 1; }
  }
  textarea:focus {
    border-color: rgba(167, 139, 250, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1) !important;
  }
`
document.head.appendChild(styleSheet)

export default Chatbot
