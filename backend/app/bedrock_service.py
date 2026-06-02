import boto3
import json
import os
from typing import Optional

class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.model_id = os.getenv("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")

    def invoke(self, prompt: str, system: Optional[str] = None) -> str:
        system_prompt = system or (
            "You are an expert cybersecurity analyst specializing in threat detection, "
            "log analysis, and incident response. Provide precise, actionable analysis."
        )
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2048,
            "system": system_prompt,
            "messages": [{"role": "user", "content": prompt}],
        }
        response = self.client.invoke_model(
            modelId=self.model_id,
            body=json.dumps(body),
            contentType="application/json",
        )
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]
