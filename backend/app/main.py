from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.schemas import LogAnalysisRequest, LogAnalysisResponse, ChatRequest, ChatResponse
from app.bedrock_service import BedrockService
from app.rag_service import RAGService
from app.log_analyzer import LogAnalyzer
from app.sample_logs import SAMPLE_LOGS

services: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    bedrock = BedrockService()
    rag = RAGService()
    services["analyzer"] = LogAnalyzer(bedrock, rag)
    services["bedrock"] = bedrock
    yield
    services.clear()

app = FastAPI(title="AI Cybersecurity Threat Analyzer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/samples")
def get_samples():
    return {"samples": list(SAMPLE_LOGS.keys())}

@app.get("/samples/{name}")
def get_sample(name: str):
    if name not in SAMPLE_LOGS:
        raise HTTPException(status_code=404, detail="Sample not found")
    return {"log_text": SAMPLE_LOGS[name]}

@app.post("/analyze", response_model=LogAnalysisResponse)
def analyze_logs(request: LogAnalysisRequest):
    try:
        return services["analyzer"].analyze(request.log_text, request.use_rag)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    try:
        prompt = request.message
        if request.context:
            prompt = f"Context from log analysis:\n{request.context}\n\nQuestion: {request.message}"
        response = services["bedrock"].invoke(prompt)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
