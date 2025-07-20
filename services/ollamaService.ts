
export class OllamaService {
  private llmUrl: string;
  private model: string;
  private maxTokens: number;

  constructor() {
    this.llmUrl = process.env.EXPO_PUBLIC_LOCAL_LLM_URL || 'http://localhost:11434';
    this.model = process.env.EXPO_PUBLIC_LOCAL_LLM_MODEL || 'llama3';
    this.maxTokens = parseInt(process.env.EXPO_PUBLIC_LOCAL_LLM_MAX_TOKENS || '4096');
  }

  /**
   * Send a custom prompt to the Ollama LLM and get the response.
   */
  async generate(prompt: string, options: Partial<{ temperature: number; top_p: number; num_predict: number }> = {}): Promise<string> {
    if (!this.llmUrl) {
      throw new Error('Ollama LLM URL is not configured.');
    }
    const body = {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.0,
        top_p: options.top_p ?? 0.9,
        num_predict: options.num_predict ?? this.maxTokens,
      },
    };
    const response = await fetch(`${this.llmUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data.response;
  }

  /**
   * Test connection to the Ollama LLM server.
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const healthCheck = await fetch(`${this.llmUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!healthCheck.ok) {
        return { success: false, message: `Server not reachable: ${healthCheck.status} - ${healthCheck.statusText}` };
      }
      // Test model
      const response = await this.generate('Hello, this is a test. Please respond with "Connection successful"', { num_predict: 20 });
      if (response.toLowerCase().includes('connection successful')) {
        return { success: true, message: 'Ollama LLM connection successful!' };
      }
      return { success: false, message: 'Ollama LLM responded, but did not return expected message.' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Unknown error' };
    }
  }
}

export const ollamaService = new OllamaService(); 