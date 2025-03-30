/**
 * Fallback AI Model
 * Used when other models are unavailable or fail
 */

import { BaseAIModel } from "./baseModel";
import {
  AIModelId,
  AIModelProvider,
  AIModelRequest,
  AIModelResponse,
} from "../types";

export class FallbackModel extends BaseAIModel {
  constructor() {
    super(AIModelId.FALLBACK, "Fallback Model", AIModelProvider.FALLBACK, {});
  }

  /**
   * Fallback model is always available
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Generate a simple response without calling any external API
   */
  async generateResponse(request: AIModelRequest): Promise<AIModelResponse> {
    const startTime = Date.now();

    // Create a simple response based on the query
    let content = `I'm sorry, I'm currently operating in fallback mode and cannot process your request fully. `;

    if (request.query.toLowerCase().includes("help")) {
      content +=
        "If you need assistance, please try again later when our primary AI models are available.";
    } else if (request.query.toLowerCase().includes("error")) {
      content +=
        "It seems our primary AI models are currently unavailable. Our team has been notified.";
    } else {
      content +=
        "Our primary AI models are currently unavailable. Please try again later.";
    }

    const processingTime = (Date.now() - startTime) / 1000;
    const inputTokens = this.calculateTokenCount(request.query);
    const outputTokens = this.calculateTokenCount(content);

    return this.createResponse(content, {
      processingTime,
      tokenCount: {
        input: inputTokens,
        output: outputTokens,
      },
      isFallback: true,
    });
  }
}
