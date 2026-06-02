import { useState, useRef, useEffect } from 'react'
import './style.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const SEVERITY_COLOR = {
  CRITICAL: '#ff2d55',
  HIGH: '#ff6b35',
  MEDIUM: '#ffd60a',
  LOW: '#30d158',
  INFO: '#636366',
}

const THREAT_LEVEL_COLOR = {
  CRITICAL: '#ff2d55',
  HIGH: '#ff6b35',
  MEDIUM: '#ffd60a',
  LOW: '#30d158',
  NONE: '#30d158',
  UNKNOWN: '#636366',
}

function cleanText(text) {
  return text
    .replace(/#{1,6}\s+/g, '')         // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
    .replace(/\*(.+?)\*/g, '$1')       // italic
    .replace(/`{1,3}[^`]*`{1,3}/g, m => m.replace(/`/g, '')) // code
    .replace(/^[-*+]\s+/gm, '• ')     // bullets
    .replace(/^\d+\.\s+/gm, (m, o, s) => m) // numbered lists keep as-is
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links
    .replace(/_{1,2}(.+?)_{1,2}/g, '$1') // underline/italic
    .replace(/\\n/g, '\n')
    .trim()
}

export default function App() {
  const [logText, setLogText] = useState('')
  const [useRag, setUseRag] = useState(true)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [samples, setSamples] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('analyze')
  const [theme, setTheme] = useState('dark')
  const chatEndRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    fetch(`${API}/samples`)
      .then(r => r.json())
      .then(d => setSamples(d.samples))
      .catch(() => {})
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  async function loadSample(name) {
    const r = await fetch(`${API}/samples/${name}`)
    const d = await r.json()
    setLogText(d.log_text.trim())
  }

  async function analyze() {
    if (!logText.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const r = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_text: logText, use_rag: useRag }),
      })
      if (!r.ok) throw new Error((await r.json()).detail)
      const data = await r.json()
      data.summary = cleanText(data.summary)
      data.findings = data.findings.map(f => ({
        ...f,
        description: cleanText(f.description),
        recommendation: cleanText(f.recommendation),
      }))
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', text: userMsg }])
    setChatLoading(true)
    try {
      const context = result
        ? `Threat Level: ${result.threat_level}\nSummary: ${result.summary}\nFindings: ${result.findings.map(f => f.category + ': ' + f.description).join('; ')}`
        : undefined
      const r = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context }),
      })
      const d = await r.json()
      setChatMessages(m => [...m, { role: 'assistant', text: cleanText(d.response) }])
    } catch (e) {
      setChatMessages(m => [...m, { role: 'assistant', text: 'Error: ' + e.message }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <div className="logo">🛡️</div>
        <div className="header-text">
          <h1>AI Cybersecurity Threat Analyzer</h1>
          <p>Powered by Amazon Bedrock + RAG</p>
        </div>
        <div className="header-status">
          <span className="status-dot" />
          <span>Live</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <div className="mobile-tabs">
        <button className={`mobile-tab ${activeTab === 'analyze' ? 'active' : ''}`} onClick={() => setActiveTab('analyze')}>
          🔍 Log Analysis
        </button>
        <button className={`mobile-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          🤖 Assistant {chatMessages.length > 0 && `(${chatMessages.length})`}
        </button>
      </div>

      <main>
        {/* ── Left Panel: Log Analysis ── */}
        <section className="panel" data-hidden={activeTab !== 'analyze' ? 'true' : 'false'}>
          <div className="panel-header">
            <div className="panel-title">
              <span className="panel-icon">📋</span>
              <h2>Log Analysis</h2>
            </div>
            <div className="samples">
              {samples.map(s => (
                <button key={s} className="sample-btn" onClick={() => loadSample(s)}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="log-input-wrap">
            <textarea
              value={logText}
              onChange={e => setLogText(e.target.value)}
              placeholder="Paste security logs here or load a sample above..."
              rows={10}
            />
          </div>

          <div className="controls">
            <label className="toggle">
              <input type="checkbox" checked={useRag} onChange={e => setUseRag(e.target.checked)} />
              <span>Use RAG (Threat Intelligence)</span>
            </label>
            <button className="analyze-btn" onClick={analyze} disabled={loading || !logText.trim()}>
              {loading ? '⏳ Analyzing...' : '🔍 Analyze Threats'}
            </button>
          </div>

          {error && <div className="error">⚠️ {error}</div>}

          {result && (
            <div className="result">
              <div className="result-header">
                <div className="threat-info">
                  <span className="label">Threat Level</span>
                  <span className="threat-badge" style={{ background: THREAT_LEVEL_COLOR[result.threat_level] }}>
                    {result.threat_level}
                  </span>
                </div>
                {result.rag_context_used && <span className="rag-badge">✦ RAG Enhanced</span>}
              </div>

              <p className="summary">{result.summary}</p>

              <div className="findings">
                {result.findings.map((f, i) => (
                  <div key={i} className="finding">
                    <div className="finding-header">
                      <span className="severity-dot" style={{ background: SEVERITY_COLOR[f.severity], color: SEVERITY_COLOR[f.severity] }} />
                      <strong>{f.category}</strong>
                      <span className="severity-label" style={{ color: SEVERITY_COLOR[f.severity] }}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="finding-desc">{f.description}</p>
                    <div className="recommendation">💡 {f.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Right Panel: Chat ── */}
        <section className="panel chat-panel" data-hidden={activeTab !== 'chat' ? 'true' : 'false'}>
          <div className="chat-header">
            <span className="panel-icon">🤖</span>
            <h2>Security Assistant</h2>
            {result && <span className="chat-context-badge">✓ Has context</span>}
          </div>

          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-placeholder">
                <div className="chat-placeholder-icon">💬</div>
                <p>Ask questions about the analysis or any cybersecurity topic</p>
                {result && <p style={{ color: 'var(--accent)', fontSize: '12px' }}>Analysis context is loaded ✓</p>}
              </div>
            )}
            {chatMessages.map((m, i) => (
              <div key={i} className={`message ${m.role}`}>
                <div className="avatar">{m.role === 'user' ? '👤' : '🤖'}</div>
                <span className="text">{m.text}</span>
              </div>
            ))}
            {chatLoading && (
              <div className="message assistant">
                <div className="avatar">🤖</div>
                <span className="text typing">
                  <span /><span /><span />
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-wrap">
            <div className="chat-input">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="Ask a security question..."
                disabled={chatLoading}
              />
              <button className="send-btn" onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                Send ↑
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
