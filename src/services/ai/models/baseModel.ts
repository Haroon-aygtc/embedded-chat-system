/**
 * Base AI Model
 * Provides common functionality for all AI models
 */

import {
  AIModel,
  AIModelConfig,
  AIModelRequest,
  AIModelResponse,
} from "../types";

export abstract class BaseAIModel implements AIModel {
  id: string;
  name: string;
  provider: string;
  protected config: AIModelConfig;

  constructor(
    id: string,
    name: string,
    provider: string,
    config: AIModelConfig = {},
  ) {
    this.id = id;
    this.name = name;
    this.provider = provider;
    this.config = {
      temperature: 0.7,
      maxTokens: 1024,
      ...config,
    };
  }

  /**
   * Check if the model is available for use
   * This should be overridden by specific model implementations
   */
  async isAvailable(): Promise<boolean> {
    // Default implementation checks if API key is set
    return !!this.config.apiKey;
  }

  /**
   * Generate a response from the model
   * This must be implemented by specific model implementations
   */
  abstract generateResponse(request: AIModelRequest): Promise<AIModelResponse>;

  /**
   * Get the current configuration
   */
  getConfig(): AIModelConfig {
    return { ...this.config };
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<AIModelConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Create a standardized response object
   */
  protected createResponse(
    content: string,
    metadata: Record<string, any> = {},
  ): AIModelResponse {
    return {
      content,
      modelUsed: this.id,
      metadata: {
        ...metadata,
        provider: this.provider,
      },
    };
  }

  /**
   * Calculate token count (approximate)
   * This is a simple approximation - actual token count depends on the tokenizer used by the model
   */
  protected calculateTokenCount(text: string): number {
    // Rough approximation: 4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Format error response
   */
  protected handleError(error: any): AIModelResponse {
    console.error(`Error in ${this.name} model:`, error);
    return {
      content: `I'm sorry, I encountered an error while processing your request. Please try again later.`,
      modelUsed: this.id,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        errorType:
          error instanceof Error ? error.constructor.name : typeof error,
      },
    };
  }
}
