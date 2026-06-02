import numpy as np
import boto3
import json
import os
from typing import List

# Threat intelligence knowledge base
THREAT_KNOWLEDGE = [
    {
        "id": "brute-force-ssh",
        "text": "SSH brute force attack: Multiple failed login attempts in rapid succession targeting SSH port 22. "
                "Indicators: >5 failed attempts within 60 seconds from same IP. "
                "Mitigation: Implement fail2ban, use key-based auth, disable root SSH login, use non-standard port.",
    },
    {
        "id": "sql-injection",
        "text": "SQL Injection attack: Malicious SQL code inserted into input fields to manipulate database queries. "
                "Indicators: UNION SELECT, OR 1=1, DROP TABLE, single quotes causing 500 errors. "
                "Mitigation: Use parameterized queries, WAF, input validation, least-privilege DB accounts.",
    },
    {
        "id": "c2-beaconing",
        "text": "Command & Control (C2) beaconing: Malware communicating with attacker infrastructure at regular intervals. "
                "Indicators: Periodic outbound connections at fixed intervals, connections to known malicious IPs, "
                "unusual DNS queries, process injection. "
                "Mitigation: Network segmentation, DNS filtering, EDR solutions, egress filtering.",
    },
    {
        "id": "privilege-escalation",
        "text": "Privilege escalation: Attacker gains higher-level permissions than intended. "
                "Indicators: sudo abuse, SUID binary exploitation, token impersonation, unexpected admin logins. "
                "Mitigation: Principle of least privilege, PAM configuration, audit logging.",
    },
    {
        "id": "data-exfiltration",
        "text": "Data exfiltration: Unauthorized transfer of data outside the organization. "
                "Indicators: Large outbound transfers, DNS tunneling, unusual upload activity, access to sensitive files. "
                "Mitigation: DLP solutions, network monitoring, data classification, egress filtering.",
    },
    {
        "id": "xss",
        "text": "Cross-Site Scripting (XSS): Injection of malicious scripts into web pages. "
                "Indicators: <script> tags in inputs, javascript: URLs, event handlers in parameters. "
                "Mitigation: Content Security Policy, output encoding, input sanitization.",
    },
    {
        "id": "ransomware",
        "text": "Ransomware activity: Malware encrypting files and demanding payment. "
                "Indicators: Mass file modifications, shadow copy deletion, vssadmin commands, unusual CPU/disk usage. "
                "Mitigation: Offline backups, EDR, network segmentation, user training.",
    },
    {
        "id": "lateral-movement",
        "text": "Lateral movement: Attacker moving through network after initial compromise. "
                "Indicators: Unusual SMB traffic, PsExec usage, WMI remote execution, pass-the-hash. "
                "Mitigation: Network segmentation, credential hygiene, monitoring east-west traffic.",
    },
]


class RAGService:
    def __init__(self):
        self.bedrock = boto3.client(
            "bedrock-runtime",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
        self.embedding_model = "amazon.titan-embed-text-v2:0"
        self._index: List[np.ndarray] = []
        self._build_index()

    def _embed(self, text: str) -> np.ndarray:
        response = self.bedrock.invoke_model(
            modelId=self.embedding_model,
            body=json.dumps({"inputText": text}),
            contentType="application/json",
        )
        result = json.loads(response["body"].read())
        return np.array(result["embedding"], dtype=np.float32)

    def _build_index(self):
        for doc in THREAT_KNOWLEDGE:
            self._index.append(self._embed(doc["text"]))

    def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        query_vec = self._embed(query)
        scores = []
        for i, vec in enumerate(self._index):
            # Cosine similarity
            score = float(np.dot(query_vec, vec) / (np.linalg.norm(query_vec) * np.linalg.norm(vec) + 1e-9))
            scores.append((score, i))
        scores.sort(reverse=True)
        return [THREAT_KNOWLEDGE[i]["text"] for _, i in scores[:top_k]]
