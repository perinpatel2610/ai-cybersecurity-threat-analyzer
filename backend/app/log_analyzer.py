import json
import re
from app.bedrock_service import BedrockService
from app.rag_service import RAGService
from app.schemas import LogAnalysisResponse, ThreatFinding


class LogAnalyzer:
    def __init__(self, bedrock: BedrockService, rag: RAGService):
        self.bedrock = bedrock
        self.rag = rag

    def analyze(self, log_text: str, use_rag: bool = True) -> LogAnalysisResponse:
        rag_context = ""
        if use_rag:
            docs = self.rag.retrieve(log_text)
            rag_context = "\n\n".join(docs)

        prompt = self._build_prompt(log_text, rag_context)
        raw_response = self.bedrock.invoke(prompt)
        return self._parse_response(raw_response, rag_context_used=use_rag and bool(rag_context))

    def _build_prompt(self, log_text: str, rag_context: str) -> str:
        context_section = ""
        if rag_context:
            context_section = f"""
## Threat Intelligence Context
{rag_context}

"""
        return f"""{context_section}## Security Logs to Analyze
{log_text}

Analyze these logs and respond with ONLY valid JSON in this exact format:
{{
  "summary": "Brief overall summary of what was found",
  "threat_level": "CRITICAL|HIGH|MEDIUM|LOW|NONE",
  "findings": [
    {{
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "category": "Attack category name",
      "description": "What was detected and evidence from logs",
      "recommendation": "Specific remediation steps"
    }}
  ]
}}"""

    def _parse_response(self, raw: str, rag_context_used: bool) -> LogAnalysisResponse:
        # Extract JSON from response
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if not match:
            return LogAnalysisResponse(
                summary="Failed to parse AI response",
                threat_level="UNKNOWN",
                findings=[],
                rag_context_used=rag_context_used,
                raw_ai_response=raw,
            )
        data = json.loads(match.group())
        findings = [ThreatFinding(**f) for f in data.get("findings", [])]
        return LogAnalysisResponse(
            summary=data.get("summary", ""),
            threat_level=data.get("threat_level", "UNKNOWN"),
            findings=findings,
            rag_context_used=rag_context_used,
            raw_ai_response=raw,
        )
