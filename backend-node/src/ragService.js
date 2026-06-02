import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const THREAT_KNOWLEDGE = [
  {
    id: 'brute-force-ssh',
    text: 'SSH brute force attack: Multiple failed login attempts in rapid succession targeting SSH port 22. Indicators: >5 failed attempts within 60 seconds from same IP. Mitigation: Implement fail2ban, use key-based auth, disable root SSH login, use non-standard port.',
  },
  {
    id: 'sql-injection',
    text: 'SQL Injection attack: Malicious SQL code inserted into input fields to manipulate database queries. Indicators: UNION SELECT, OR 1=1, DROP TABLE, single quotes causing 500 errors. Mitigation: Use parameterized queries, WAF, input validation, least-privilege DB accounts.',
  },
  {
    id: 'c2-beaconing',
    text: 'Command & Control (C2) beaconing: Malware communicating with attacker infrastructure at regular intervals. Indicators: Periodic outbound connections at fixed intervals, connections to known malicious IPs, unusual DNS queries, process injection. Mitigation: Network segmentation, DNS filtering, EDR solutions, egress filtering.',
  },
  {
    id: 'privilege-escalation',
    text: 'Privilege escalation: Attacker gains higher-level permissions than intended. Indicators: sudo abuse, SUID binary exploitation, token impersonation, unexpected admin logins. Mitigation: Principle of least privilege, PAM configuration, audit logging.',
  },
  {
    id: 'data-exfiltration',
    text: 'Data exfiltration: Unauthorized transfer of data outside the organization. Indicators: Large outbound transfers, DNS tunneling, unusual upload activity, access to sensitive files. Mitigation: DLP solutions, network monitoring, data classification, egress filtering.',
  },
  {
    id: 'xss',
    text: 'Cross-Site Scripting (XSS): Injection of malicious scripts into web pages. Indicators: <script> tags in inputs, javascript: URLs, event handlers in parameters. Mitigation: Content Security Policy, output encoding, input sanitization.',
  },
  {
    id: 'ransomware',
    text: 'Ransomware activity: Malware encrypting files and demanding payment. Indicators: Mass file modifications, shadow copy deletion, vssadmin commands, unusual CPU/disk usage. Mitigation: Offline backups, EDR, network segmentation, user training.',
  },
  {
    id: 'lateral-movement',
    text: 'Lateral movement: Attacker moving through network after initial compromise. Indicators: Unusual SMB traffic, PsExec usage, WMI remote execution, pass-the-hash. Mitigation: Network segmentation, credential hygiene, monitoring east-west traffic.',
  },
]

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-9)
}

export class RAGService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
    this.embeddingModel = 'amazon.titan-embed-text-v2:0'
    this.index = []
  }

  async init() {
    console.log('Building RAG index...')
    for (const doc of THREAT_KNOWLEDGE) {
      const vec = await this.embed(doc.text)
      this.index.push(vec)
    }
    console.log(`RAG index built with ${this.index.length} documents`)
  }

  async embed(text) {
    const command = new InvokeModelCommand({
      modelId: this.embeddingModel,
      body: JSON.stringify({ inputText: text }),
      contentType: 'application/json',
    })
    const response = await this.client.send(command)
    const result = JSON.parse(Buffer.from(response.body).toString())
    return result.embedding
  }

  async retrieve(query, topK = 3) {
    const queryVec = await this.embed(query)
    const scores = this.index.map((vec, i) => ({
      score: cosineSimilarity(queryVec, vec),
      i,
    }))
    scores.sort((a, b) => b.score - a.score)
    return scores.slice(0, topK).map(({ i }) => THREAT_KNOWLEDGE[i].text)
  }
}
