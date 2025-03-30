/**
 * AI Model Types and Interfaces
 * Defines the common interfaces for all AI models in the system
 */

export interface AIModelConfig {
  apiKey?: string;
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  timeout?: number;
  baseUrl?: string;
  additionalParams?: Record<string, any>;
}

export interface AIModelResponse {
  content: string;
  modelUsed: string;
  metadata?: {
    processingTime?: number;
    tokenCount?: {
      input?: number;
      output?: number;
    };
    [key: string]: any;
  };
  knowledgeBaseResults?: number;
  knowledgeBaseIds?: string[];
}

export interface AIModelRequest {
  query: string;
  contextRuleId?: string;
  userId: string;
  knowledgeBaseIds?: string[];
  promptTemplate?: string;
  systemPrompt?: string;
  preferredModel?: string;
  maxTokens?: number;
  temperature?: number;
  additionalParams?: Record<string, any>;
}

export interface AIModel {
  /**
   * The unique identifier for this model
   */
  id: string;

  /**
   * The display name for this model
   */
  name: string;

  /**
   * The provider of this model (e.g., "Google", "Anthropic", "HuggingFace")
   */
  provider: string;

  /**
   * Whether this model is currently available for use
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generate a response from the model
   */
  generateResponse(request: AIModelRequest): Promise<AIModelResponse>;

  /**
   * Get the configuration for this model
   */
  getConfig(): AIModelConfig;

  /**
   * Update the configuration for this model
   */
  updateConfig(config: Partial<AIModelConfig>): void;
}

export enum AIModelProvider {
  GEMINI = "Google",
  GROK = "xAI",
  HUGGINGFACE = "HuggingFace",
  FALLBACK = "Fallback",
  CUSTOM = "Custom",
  ANTHROPIC = "Anthropic",
  MISTRAL = "Mistral",
}

export enum AIModelId {
  GEMINI_PRO = "gemini-pro",
  GEMINI_PRO_VISION = "gemini-pro-vision",
  GROK_1 = "grok-1",
  HUGGINGFACE_MISTRAL = "mistralai/Mistral-7B-Instruct-v0.2",
  HUGGINGFACE_LLAMA = "meta-llama/Llama-2-70b-chat-hf",
  FALLBACK = "fallback-model",
}
