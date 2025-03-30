/**
 * Grok AI Model Implementation
 */

import { BaseAIModel } from "./baseModel";
import {
  AIModelId,
  AIModelProvider,
  AIModelRequest,
  AIModelResponse,
} from "../types";
import env from "@/config/env";
import axios from "axios";

export class GrokModel extends BaseAIModel {
  constructor() {
    super(AIModelId.GROK_1, "Grok-1", AIModelProvider.GROK, {
      apiKey: env.GROK_API_KEY,
      baseUrl: "https://api.grok.x.ai/v1",
      temperature: 0.7,
      maxTokens: 1024,
    });
  }

  /**
   * Check if the Grok API key is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.apiKey;
  }

  /**
   * Generate a response using the Grok API
   */
  async generateResponse(request: AIModelRequest): Promise<AIModelResponse> {
    try {
      const startTime = Date.now();

      // Prepare the request payload
      const payload = {
        model: AIModelId.GROK_1,
        messages: [
          ...(request.systemPrompt
            ? [{ role: "system", content: request.systemPrompt }]
            : []),
          { role: "user", content: request.query },
        ],
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens || this.config.maxTokens,
        ...request.additionalParams,
      };

      // Send the request to the Grok API
      const response = await axios.post(
        `${this.config.baseUrl}/chat/completions`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: this.config.timeout || 30000,
        },
      );

      // Extract the response content
      const content = response.data.choices[0]?.message?.content || "";

      // Calculate processing time and token counts
      const processingTime = (Date.now() - startTime) / 1000;
      const inputTokens =
        response.data.usage?.prompt_tokens ||
        this.calculateTokenCount(request.query);
      const outputTokens =
        response.data.usage?.completion_tokens ||
        this.calculateTokenCount(content);

      return this.createResponse(content, {
        processingTime,
        tokenCount: {
          input: inputTokens,
          output: outputTokens,
        },
        modelId: response.data.model,
        finishReason: response.data.choices[0]?.finish_reason,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
