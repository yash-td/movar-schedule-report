import { Message } from '../types/chat';

const API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

const systemPrompt = `You are a senior project controls analyst who specialises in Primavera P6 schedules. When provided with structured schedule metrics you must craft an evidence-based narrative that helps project teams understand performance, risk, and recommended follow-up actions.

Always respond in markdown using the following structure:

## Project Overview
- Brief summary of the schedule timeline, scope, and current outlook.

### Key Statistics
- Present the most relevant dates, counts, and indicators shared in the prompt.

## Analysis
- Explain what the metrics suggest about schedule health, critical path behaviour, float consumption, and emerging trends.
- Reference quantitative signals when possible.

## Recommendations
- List the next best actions or controls to investigate.

Tone guidelines:
- Stay objective and data-driven.
- Avoid marketing language.
- If important data points are missing, call them out and explain the assumption you are making.`;

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class ChatService {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 5000
  };

  private validateConfig() {
    if (!API_KEY || !ENDPOINT || !DEPLOYMENT) {
      throw new Error('API configuration is missing. Please check your environment variables.');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRetryDelay(attempt: number): number {
    const { baseDelay, maxDelay } = this.retryConfig;
    const delay = Math.min(
      baseDelay * Math.pow(2, attempt),
      maxDelay
    );
    // Add some jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  private async makeRequestWithRetry(messages: Message[], attempt = 0): Promise<string> {
    try {
      this.validateConfig();

      const modelConfig = {
        max_completion_tokens: 100000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(
        `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=2025-01-01-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': API_KEY,
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            ...modelConfig,
            stop: null,
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage = `API request failed (${response.status})`;
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.error?.message || parsedError.message || errorMessage;
        } catch {
          errorMessage += `: ${errorData || response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from API');
      }

      if (data.choices[0].finish_reason === 'length') {
        return data.choices[0].message.content + '\n\n[Note: Response was truncated due to length limits. Please ask for continuation if needed.]';
      }

      return data.choices[0].message.content;
    } catch (error) {
      // Check if we should retry
      if (attempt < this.retryConfig.maxRetries && this.shouldRetry(error)) {
        const delay = this.getRetryDelay(attempt);
        console.log(`Retrying request (attempt ${attempt + 1}/${this.retryConfig.maxRetries}) after ${delay}ms`);
        await this.delay(delay);
        return this.makeRequestWithRetry(messages, attempt + 1);
      }

      // If we're out of retries or shouldn't retry, throw a user-friendly error
      throw this.createUserFriendlyError(error);
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return true;
    }
    if (error instanceof Error && error.message.includes('API request failed (5')) {
      return true;
    }
    if (error.name === 'AbortError') {
      return true;
    }
    return false;
  }

  private createUserFriendlyError(error: any): Error {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    if (error.name === 'AbortError') {
      return new Error('The request timed out. Please try again.');
    }
    if (error instanceof Error) {
      // Clean up technical details from error messages
      const message = error.message
        .replace(/https?:\/\/[^\s<>]*[^.,;!?\s<>)]/g, '[URL]') // Remove URLs
        .replace(/API key|api-key|api key/gi, 'credentials') // Remove sensitive terms
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]'); // Remove IP addresses
      
      return new Error(`An error occurred: ${message}`);
    }
    return new Error('An unexpected error occurred. Please try again.');
  }

  async sendMessage(messages: Message[]): Promise<string> {
    try {
      if (!messages?.length) {
        throw new Error('No messages provided');
      }

      return await this.makeRequestWithRetry(messages);
    } catch (error) {
      const userFriendlyError = this.createUserFriendlyError(error);
      console.error('Chat service error:', userFriendlyError.message);
      throw userFriendlyError;
    }
  }
}

export const chatService = new ChatService();
