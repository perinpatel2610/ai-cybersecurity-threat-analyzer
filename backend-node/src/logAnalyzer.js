export class LogAnalyzer {
  constructor(bedrockService, ragService) {
    this.bedrock = bedrockService
    this.rag = ragService
  }

  async analyze(logText, useRag = true) {
    let ragContext = ''
    if (useRag) {
      const docs = await this.rag.retrieve(logText)
      ragContext = docs.join('\n\n')
    }

    const prompt = this.buildPrompt(logText, ragContext)
    const raw = await this.bedrock.invoke(prompt)
    return this.parseResponse(raw, useRag && ragContext.length > 0)
  }

  buildPrompt(logText, ragContext) {
    const contextSection = ragContext
      ? `## Threat Intelligence Context\n${ragContext}\n\n`
      : ''

    return `${contextSection}## Security Logs to Analyze\n${logText}\n\nAnalyze these logs and respond with ONLY valid JSON in this exact format:
{
  "summary": "Brief overall summary of what was found",
  "threat_level": "CRITICAL|HIGH|MEDIUM|LOW|NONE",
  "findings": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "Attack category name",
      "description": "What was detected and evidence from logs",
      "recommendation": "Specific remediation steps"
    }
  ]
}`
  }

  parseResponse(raw, ragContextUsed) {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      return { summary: 'Failed to parse AI response', threat_level: 'UNKNOWN', findings: [], rag_context_used: ragContextUsed, raw_ai_response: raw }
    }
    const data = JSON.parse(match[0])
    return {
      summary: data.summary || '',
      threat_level: data.threat_level || 'UNKNOWN',
      findings: data.findings || [],
      rag_context_used: ragContextUsed,
      raw_ai_response: raw,
    }
  }
}
