/**
 * AI Model Factory
 * Creates and manages AI model instances
 */

import {
  AIModel,
  AIModelId,
  AIModelProvider,
  AIModelRequest,
  AIModelResponse,
} from "./types";
import { GeminiModel } from "./models/geminiModel";
import { GrokModel } from "./models/grokModel";
import { HuggingFaceModel } from "./models/huggingFaceModel";
import { FallbackModel } from "./models/fallbackModel";
import { CustomModel } from "./models/customModel";
import env from "@/config/env";

class AIModelFactory {
  private models: Map<string, AIModel> = new Map();
  private defaultModelId: string = AIModelId.GEMINI_PRO;
  private fallbackModel: FallbackModel;

  constructor() {
    // Initialize the fallback model
    this.fallbackModel = new FallbackModel();
    this.models.set(this.fallbackModel.id, this.fallbackModel);

    // Initialize the primary models
    this.initializeModels();
  }

  /**
   * Initialize all available AI models
   */
  private initializeModels(): void {
    // Initialize Gemini models
    if (env.GEMINI_API_KEY) {
      const geminiPro = new GeminiModel(AIModelId.GEMINI_PRO);
      this.models.set(geminiPro.id, geminiPro);

      const geminiProVision = new GeminiModel(AIModelId.GEMINI_PRO_VISION);
      this.models.set(geminiProVision.id, geminiProVision);
    }

    // Initialize Grok model
    if (env.GROK_API_KEY) {
      const grok = new GrokModel();
      this.models.set(grok.id, grok);
    }

    // Initialize Hugging Face models
    if (env.HUGGINGFACE_API_KEY) {
      const mistral = new HuggingFaceModel(AIModelId.HUGGINGFACE_MISTRAL);
      this.models.set(mistral.id, mistral);

      const llama = new HuggingFaceModel(AIModelId.HUGGINGFACE_LLAMA);
      this.models.set(llama.id, llama);
    }
  }

  /**
   * Get an AI model by ID
   */
  getModel(modelId: string): AIModel {
    return this.models.get(modelId) || this.fallbackModel;
  }

  /**
   * Get all available models
   */
  getAllModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get all available models by provider
   */
  getModelsByProvider(provider: AIModelProvider): AIModel[] {
    return this.getAllModels().filter((model) => model.provider === provider);
  }

  /**
   * Set the default model ID
   */
  setDefaultModelId(modelId: string): void {
    if (this.models.has(modelId)) {
      this.defaultModelId = modelId;
    }
  }

  /**
   * Get the default model ID
   */
  getDefaultModelId(): string {
    return this.defaultModelId;
  }

  /**
   * Get the default model
   */
  getDefaultModel(): AIModel {
    return this.getModel(this.defaultModelId);
  }

  /**
   * Generate a response using the specified or default model
   */
  async generateResponse(request: AIModelRequest): Promise<AIModelResponse> {
    const modelId = request.preferredModel || this.defaultModelId;
    const model = this.getModel(modelId);

    try {
      // Check if the model is available
      const isAvailable = await model.isAvailable();
      if (!isAvailable) {
        console.warn(
          `Model ${modelId} is not available, falling back to default model`,
        );
        return this.fallbackModel.generateResponse(request);
      }

      // Generate the response
      return await model.generateResponse(request);
    } catch (error) {
      console.error(`Error generating response with model ${modelId}:`, error);
      return this.fallbackModel.generateResponse(request);
    }
  }

  /**
   * Register a new model
   */
  registerModel(model: AIModel): void {
    this.models.set(model.id, model);
  }

  /**
   * Register a custom model with the given configuration
   */
  registerCustomModel(id: string, name: string, config: any): AIModel {
    const customModel = new CustomModel(id, name, config);
    this.registerModel(customModel);
    return customModel;
  }

  /**
   * Unregister a model
   */
  unregisterModel(modelId: string): boolean {
    if (modelId === this.fallbackModel.id) {
      return false; // Cannot unregister the fallback model
    }
    return this.models.delete(modelId);
  }
}

// Create a singleton instance
const aiModelFactory = new AIModelFactory();

export default aiModelFactory;
