/**
 * Hugging Face AI Model Implementation
 */

import { BaseAIModel } from "./baseModel";
import {
  AIModelId,
  AIModelProvider,
  AIModelRequest,
  AIModelResponse,
} from "../types";
import env from "@/config/env";

export class HuggingFaceModel extends BaseAIModel {
  constructor(modelName: string = AIModelId.HUGGINGFACE_MISTRAL) {
    super(
      modelName,
      modelName.split("/").pop() || "Hugging Face Model",
      AIModelProvider.HUGGINGFACE,
      {
        apiKey: env.HUGGINGFACE_API_KEY,
        modelName,
        temperature: 0.7,
        maxTokens: 1024,
      },
    );
  }

  /**
   * Check if the Hugging Face API key is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  /**
   * Generate a response using the Hugging Face Inference API
   */
  async generateResponse(request: AIModelRequest): Promise<AIModelResponse> {
    try {
      const startTime = Date.now();

      // Import the Hugging Face Inference library dynamically
      const { HfInference } = await import("@huggingface/inference");

      // Initialize the Hugging Face client
      const hf = new HfInference(this.config.apiKey as string);

      // Prepare the prompt
      let prompt = request.query;
      if (request.systemPrompt) {
        // Format with system prompt for instruction-tuned models
        prompt = `<|system|>\n${request.systemPrompt}\n<|user|>\n${request.query}\n<|assistant|>\n`;
      }

      // Send the query to the model
      const response = await hf.textGeneration({
        model: this.config.modelName as string,
        inputs: prompt,
        parameters: {
          temperature: request.temperature || this.config.temperature,
          max_new_tokens: request.maxTokens || this.config.maxTokens,
          return_full_text: false,
          ...request.additionalParams,
        },
      });

      // Extract the generated text
      const content = response.generated_text;

      // Calculate processing time and token counts
      const processingTime = (Date.now() - startTime) / 1000;
      const inputTokens = this.calculateTokenCount(prompt);
      const outputTokens = this.calculateTokenCount(content);

      return this.createResponse(content, {
        processingTime,
        tokenCount: {
          input: inputTokens,
          output: outputTokens,
        },
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
