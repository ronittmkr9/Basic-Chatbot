import { useState, useRef, useEffect, useCallback } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"
import "./Chatbot.css"

const API = process.env.REACT_APP_API_URL || "https://basic-chatbot-1-zu32.onrender.com"
const STORAGE_KEY = "chatbot:session:v1"
const MEMORY_MS = 24 * 60 * 60 * 1000 // chats are remembered for 1 day after the last message
const HISTORY_LIMIT = 20 // how many past messages are sent to the model

const SUGGESTIONS = [
  "Explain how an API works in simple terms",
  "Help me debug a Python error",
  "Write a short email asking for a deadline extension",
]

// Load saved chat; discard it if the last message is older than 4 hours.
function loadMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    if (!Array.isArray(saved) || saved.length === 0) return []
    const last = saved[saved.length - 1].ts
    if (Date.now() - last > MEMORY_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
    return saved
  } catch {
    return []
  }
}

function saveMessages(messages) {
  try {
    if (messages.length === 0) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    /* storage unavailable (private mode / full) – chat still works, just isn't remembered */
  }
}

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

export default function Chatbot() {
  const [messages, setMessages] = useState(loadMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [waking, setWaking] = useState(false)
  const endRef = useRef(null)
  const inputRef = useRef(null)

  // Persist on every change
  useEffect(() => saveMessages(messages), [messages])

  // Expire the chat while the tab stays open
  useEffect(() => {
    const id = setInterval(() => {
      setMessages((prev) => {
        if (prev.length && Date.now() - prev[prev.length - 1].ts > MEMORY_MS) return []
        return prev
      })
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading])

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 180) + "px"
  }, [input])

  const send = useCallback(
    async (text, { retry = false } = {}) => {
      const content = text.trim()
      if (!content || loading) return

      // Conversation so far (without error bubbles) becomes the model's memory
      let base = messages.filter((m) => !m.error)
      if (retry) base = base.slice(0, -1) // the failed user message is re-sent below
      const history = base
        .slice(-HISTORY_LIMIT)
        .map((m) => ({ role: m.role, content: m.text }))

      const userMsg = { id: crypto.randomUUID(), role: "user", text: content, ts: Date.now() }
      setMessages([...base, userMsg])
      setInput("")
      setLoading(true)

      const wakeTimer = setTimeout(() => setWaking(true), 6000)
      try {
        const res = await axios.post(
          `${API}/chat`,
          { message: content, history },
          { timeout: 60000 }
        )
        const reply = { id: crypto.randomUUID(), role: "assistant", text: res.data.reply, ts: Date.now() }
        setMessages((prev) => [...prev, reply])
      } catch (err) {
        let text = "Couldn't reach the server. Check your connection and try again."
        if (err.code === "ECONNABORTED") text = "The server is taking too long to start. Try again in a moment."
        else if (err.response?.data?.error) text = err.response.data.error
        else if (err.response) text = `The server returned an error (${err.response.status}).`
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text, ts: Date.now(), error: true, retryText: content },
        ])
      } finally {
        clearTimeout(wakeTimer)
        setWaking(false)
        setLoading(false)
        inputRef.current?.focus()
      }
    },
    [messages, loading]
  )

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const newChat = () => {
    setMessages([])
    setInput("")
    inputRef.current?.focus()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">R</span>
          <div>
            <h1>AI Assistant</h1>
            <p>Built by Ronit Tamrakar</p>
          </div>
        </div>
        <button className="ghost" onClick={newChat} disabled={messages.length === 0}>
          New chat
        </button>
      </header>

      <main className="thread" aria-live="polite">
        <div className="thread-inner">
          {messages.length === 0 ? (
            <section className="empty">
              <h2>What can I help with?</h2>
              <p>Ask a question or pick a starting point.</p>
              <div className="chips">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            messages.map((m) => (
              <article key={m.id} className={`msg ${m.role}${m.error ? " error" : ""}`}>
                {m.role === "assistant" && <span className="avatar" aria-hidden="true">AI</span>}
                <div className="bubble">
                  {m.role === "assistant" && !m.error ? (
                    <div className="md">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{m.text}</p>
                  )}
                  <footer>
                    <time>{formatTime(m.ts)}</time>
                    {m.error && (
                      <button className="retry" onClick={() => send(m.retryText, { retry: true })} disabled={loading}>
                        Try again
                      </button>
                    )}
                  </footer>
                </div>
              </article>
            ))
          )}

          {loading && (
            <article className="msg assistant">
              <span className="avatar" aria-hidden="true">AI</span>
              <div className="bubble">
                <div className="typing" aria-label="Assistant is typing">
                  <i /><i /><i />
                </div>
                {waking && <p className="hint">The server was asleep and is starting up. This can take up to a minute.</p>}
              </div>
            </article>
          )}
          <div ref={endRef} />
        </div>
      </main>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message the assistant"
            rows={1}
            maxLength={4000}
            aria-label="Message"
          />
          <button className="send" onClick={() => send(input)} disabled={loading || !input.trim()} aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
        <p className="note">Chats are saved in this browser for 1 day after your last message. Enter to send, Shift+Enter for a new line.</p>
      </div>
    </div>
  )
}
