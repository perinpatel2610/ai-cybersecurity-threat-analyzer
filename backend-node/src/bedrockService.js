import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

export class BedrockService {
  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
  }

  async invoke(prompt, system) {
    const systemPrompt = system || 'You are an expert cybersecurity analyst specializing in threat detection, log analysis, and incident response. Provide precise, actionable analysis.'

    const body = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      body,
      contentType: 'application/json',
    })

    const response = await this.client.send(command)
    const result = JSON.parse(Buffer.from(response.body).toString())
    return result.content[0].text
  }
}
