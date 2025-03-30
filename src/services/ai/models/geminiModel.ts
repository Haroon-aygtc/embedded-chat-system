/**
 * Gemini AI Model Implementation
 */

import { BaseAIModel } from "./baseModel";
import {
  AIModelId,
  AIModelProvider,
  AIModelRequest,
  AIModelResponse,
} from "../types";
import env from "@/config/env";

export class GeminiModel extends BaseAIModel {
  constructor(modelName: string = AIModelId.GEMINI_PRO) {
    super(
      modelName,
      modelName === AIModelId.GEMINI_PRO ? "Gemini Pro" : "Gemini Pro Vision",
      AIModelProvider.GEMINI,
      {
        apiKey: env.GEMINI_API_KEY,
        modelName,
        temperature: 0.7,
        maxTokens: 1024,
        topP: 0.95,
      },
    );
  }

  /**
   * Check if the Gemini API key is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  /**
   * Generate a response using the Gemini API
   */
  async generateResponse(request: AIModelRequest): Promise<AIModelResponse> {
    try {
      const startTime = Date.now();

      // Import the Google Generative AI library dynamically to avoid bundling issues
      const { GoogleGenerativeAI } = await import("@google/generative-ai");

      // Initialize the Gemini API client
      const genAI = new GoogleGenerativeAI(this.config.apiKey as string);
      const model = genAI.getGenerativeModel({
        model: this.config.modelName as string,
      });

      // Prepare the chat session
      const chat = model.startChat({
        generationConfig: {
          temperature: request.temperature || this.config.temperature,
          maxOutputTokens: request.maxTokens || this.config.maxTokens,
          topP: this.config.topP,
        },
        history: [],
      });

      // Send the query to the model
      const result = await chat.sendMessage(request.query);
      const response = await result.response;
      const content = response.text();

      // Calculate processing time and token counts
      const processingTime = (Date.now() - startTime) / 1000;
      const inputTokens = this.calculateTokenCount(request.query);
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
