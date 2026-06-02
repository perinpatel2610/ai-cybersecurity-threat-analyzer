# 🛡️ AI Cybersecurity Threat Analyzer

An AI-powered security log analysis tool built with **Amazon Bedrock** (Claude Sonnet), **RAG** (Retrieval-Augmented Generation), and **Amazon Titan Embeddings**. Paste any security logs and get instant structured threat findings with severity ratings, attack categories, and remediation steps.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Why This Stack](#why-this-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Running](#setup--running)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Sample Logs](#sample-logs)
- [Threat Intelligence Knowledge Base](#threat-intelligence-knowledge-base)

---

## Overview

This application accepts raw security logs (SSH logs, web server logs, firewall logs, EDR alerts, etc.) and uses a large language model on Amazon Bedrock to analyze them for threats. It optionally enhances the analysis using RAG — retrieving relevant threat intelligence documents before sending the prompt to the model, improving detection accuracy.

A built-in Security Assistant chat lets you ask follow-up questions about the analysis or any cybersecurity topic, with the analysis context automatically injected.

---

## Architecture

```
Browser (React + Vite)
        │
        │  HTTP (port 5173)
        ▼
  Express Backend (port 8000)
        │
        ├── BedrockService
        │     └── Amazon Bedrock → Claude Sonnet (threat analysis + chat)
        │
        ├── RAGService
        │     ├── Amazon Bedrock → Titan Embed Text v2 (embeddings)
        │     └── Cosine similarity search over in-memory vector index (pure JS)
        │
        └── LogAnalyzer
              └── Combines RAG context + Bedrock for structured JSON output
```

---

## Features

- **Log Analysis** — Paste any security logs and receive structured findings including severity, attack category, description with evidence, and specific remediation steps
- **Threat Level Rating** — Overall threat level: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `NONE`
- **RAG Enhancement** — Retrieves the top-3 most relevant threat intelligence documents using semantic similarity before invoking the model, significantly improving detection accuracy
- **Security Assistant Chat** — Conversational AI with automatic analysis context injection so you can ask follow-up questions about detected threats
- **Sample Logs** — 4 built-in samples: SSH brute force, SQL injection, malware C2 beaconing, normal traffic
- **Dark / Light Mode** — Toggle between dark and light UI themes
- **Fully Responsive** — Works on desktop and mobile with independent scrolling panels

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Backend | Node.js 20, Express 4 |
| AI Model | Amazon Bedrock — Claude Sonnet (via inference profile) |
| Embeddings | Amazon Bedrock — Titan Embed Text v2 |
| Vector Search | Pure JavaScript cosine similarity (in-memory) |
| AWS SDK | @aws-sdk/client-bedrock-runtime v3 |
| Containerization | Docker, Docker Compose |

---

## Why This Stack

### Why React + Vite?
- **React** — Component-based UI, each panel (log input, findings, chat) is an isolated reusable component. Simple state management with hooks.
- **Vite** — Dev server starts in under 1 second. Hot reload updates the browser in under 100ms. Create React App is officially deprecated — Vite is the recommended modern replacement. Zero config for JSX, built-in env variable support via `import.meta.env`.

### Why Node.js instead of Python?
- **Single language** across the entire stack — JavaScript on both frontend and backend, one mental model, easier to maintain and debug
- **AWS SDK v3** (`@aws-sdk/client-bedrock-runtime`) is the most actively maintained AWS SDK with first-class TypeScript support
- **Smaller Docker image** — ~150MB vs ~800MB for Python with numpy/scipy
- **Faster build** — `npm install` takes 8 seconds vs 20+ minutes for Python ML dependencies
- **No numpy needed** — cosine similarity is 10 lines of plain JavaScript
- Python only wins when you need local ML (PyTorch, TensorFlow). Since all AI runs on Bedrock, Node.js is the better fit here.

### Why Express?
- Minimal, unopinionated, fast — perfect for a REST API of this size
- Massive ecosystem, widely understood
- Native async/await support for non-blocking Bedrock API calls

---

## Project Structure

```
ai-cybersecurity-threat-analyzer/
├── backend-node/
│   ├── src/
│   │   ├── server.js          # Express app + all routes
│   │   ├── bedrockService.js  # Amazon Bedrock Claude invocation
│   │   ├── ragService.js      # Titan embeddings + cosine similarity + vector index
│   │   ├── logAnalyzer.js     # Orchestrates RAG + Bedrock, parses JSON response
│   │   └── sampleLogs.js      # Built-in sample log data
│   ├── .env                   # AWS credentials (not committed)
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component with dark/light mode
│   │   ├── style.css          # All styles with CSS variables for theming
│   │   └── main.jsx           # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── docker-compose.yml
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- AWS account with programmatic access (IAM access key)
- Amazon Bedrock access in `us-east-1` for:
  - `us.anthropic.claude-sonnet-4-5-20250929-v1:0` (inference profile)
  - `amazon.titan-embed-text-v2:0`

---

## Setup & Running

### 1. Configure AWS credentials

Open `backend-node/.env` and fill in your real AWS credentials:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-5-20250929-v1:0
```

To get credentials: **AWS Console → IAM → Users → your user → Security credentials → Create access key**

### 2. Start Docker Desktop

Make sure Docker Desktop is running (whale icon in taskbar is steady).

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

### 4. Open the app

Navigate to **http://localhost:5173**

---

## Local Development (without Docker)

**Backend:**
```bash
cd backend-node
npm install
node --watch src/server.js
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key | required |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key | required |
| `AWS_REGION` | AWS region for Bedrock | `us-east-1` |
| `BEDROCK_MODEL_ID` | Bedrock model/inference profile ID | `us.anthropic.claude-sonnet-4-5-20250929-v1:0` |
| `PORT` | Backend server port | `8000` |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/samples` | List available sample log names |
| `GET` | `/samples/:name` | Get content of a specific sample log |
| `POST` | `/analyze` | Analyze logs for threats |
| `POST` | `/chat` | Chat with the security assistant |

### POST /analyze

Request:
```json
{
  "log_text": "2024-01-15 03:12:01 WARN sshd: Failed password for root from 192.168.1.105",
  "use_rag": true
}
```

Response:
```json
{
  "summary": "SSH brute force attack detected from 192.168.1.105",
  "threat_level": "HIGH",
  "findings": [
    {
      "severity": "HIGH",
      "category": "SSH Brute Force Attack",
      "description": "Multiple failed SSH login attempts detected...",
      "recommendation": "Implement fail2ban, disable root SSH login..."
    }
  ],
  "rag_context_used": true,
  "raw_ai_response": "..."
}
```

### POST /chat

Request:
```json
{
  "message": "What does this attack mean?",
  "context": "optional analysis context from /analyze response"
}
```

Response:
```json
{
  "response": "The SSH brute force attack means..."
}
```

---

## How It Works

### Log Analysis Flow

1. User pastes security logs into the UI and clicks **Analyze Threats**
2. The frontend sends a `POST /analyze` request to the Express backend
3. If RAG is enabled, `RAGService` embeds the log text using **Amazon Titan Embed Text v2** and performs cosine similarity search against the in-memory threat intelligence vector index, returning the top-3 most relevant documents
4. `LogAnalyzer` builds a structured prompt combining the RAG context and the raw logs, instructing the model to respond in a strict JSON format
5. `BedrockService` invokes **Claude Sonnet** on Amazon Bedrock with the prompt
6. The JSON response is parsed and returned to the frontend
7. The UI displays the threat level, summary, and each finding with severity, description, and remediation

### RAG (Retrieval-Augmented Generation)

RAG improves the model's analysis by providing relevant background knowledge before it sees the logs. Instead of relying solely on the model's training data, the system:

1. Embeds the incoming log text into a vector using Titan Embed Text v2
2. Computes cosine similarity in pure JavaScript against pre-embedded threat intelligence documents
3. Injects the top-3 most similar documents into the prompt as context

This means if your logs contain SSH failure patterns, the model will also receive the SSH brute force threat intelligence document describing indicators and mitigations — leading to more accurate and specific output.

### Security Assistant Chat

When you send a message in the chat panel, the frontend automatically includes the current analysis result as context in the request. This allows the model to answer specific questions like "What ports should I block?" or "How do I configure fail2ban?" with full awareness of the detected threats.

---

## Sample Logs

| Sample | Description |
|---|---|
| `brute_force` | SSH brute force attack — multiple failed password attempts for `root` from a single IP |
| `sql_injection` | SQL injection attempt — UNION SELECT, OR 1=1, DROP TABLE patterns in web access logs |
| `malware_c2` | Malware C2 beaconing — periodic outbound connections at fixed 5-minute intervals to a suspicious IP, plus DNS tunneling and process injection alerts |
| `normal` | Normal traffic — legitimate logins, API calls, and scheduled backups with no threats |

---

## Threat Intelligence Knowledge Base

The RAG system uses 8 built-in threat intelligence documents covering:

| ID | Threat Type |
|---|---|
| `brute-force-ssh` | SSH brute force attacks |
| `sql-injection` | SQL injection |
| `c2-beaconing` | Command & Control beaconing |
| `privilege-escalation` | Privilege escalation |
| `data-exfiltration` | Data exfiltration |
| `xss` | Cross-Site Scripting (XSS) |
| `ransomware` | Ransomware activity |
| `lateral-movement` | Lateral movement |

Each document includes attack indicators and specific mitigation steps. These documents are embedded at startup and stored in memory as float32 vectors for fast similarity search.
