from pydantic import BaseModel
from typing import Optional, List

class LogAnalysisRequest(BaseModel):
    log_text: str
    use_rag: bool = True

class ThreatFinding(BaseModel):
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW, INFO
    category: str
    description: str
    recommendation: str

class LogAnalysisResponse(BaseModel):
    summary: str
    threat_level: str
    findings: List[ThreatFinding]
    rag_context_used: bool
    raw_ai_response: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
