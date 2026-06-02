import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { BedrockService } from './bedrockService.js'
import { RAGService } from './ragService.js'
import { LogAnalyzer } from './logAnalyzer.js'
import { SAMPLE_LOGS } from './sampleLogs.js'

const app = express()
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}))
app.use(express.json())

const bedrock = new BedrockService()
const rag = new RAGService()
const analyzer = new LogAnalyzer(bedrock, rag)

// Build RAG index on startup
rag.init().catch(err => console.error('RAG init failed:', err))

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/samples', (req, res) => {
  res.json({ samples: Object.keys(SAMPLE_LOGS) })
})

app.get('/samples/:name', (req, res) => {
  const log = SAMPLE_LOGS[req.params.name]
  if (!log) return res.status(404).json({ error: 'Sample not found' })
  res.json({ log_text: log })
})

app.post('/analyze', async (req, res) => {
  const { log_text, use_rag = true } = req.body
  if (!log_text) return res.status(400).json({ detail: 'log_text is required' })
  try {
    const result = await analyzer.analyze(log_text, use_rag)
    res.json(result)
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

app.post('/chat', async (req, res) => {
  const { message, context } = req.body
  if (!message) return res.status(400).json({ detail: 'message is required' })
  try {
    const prompt = context
      ? `Context from log analysis:\n${context}\n\nQuestion: ${message}`
      : message
    const response = await bedrock.invoke(prompt)
    res.json({ response })
  } catch (err) {
    res.status(500).json({ detail: err.message })
  }
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => console.log(`Server running on http://0.0.0.0:${PORT}`))
