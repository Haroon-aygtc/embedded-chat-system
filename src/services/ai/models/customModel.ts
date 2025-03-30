/**
 * Custom AI Model Implementation
 * Allows users to add their own AI model endpoints
 */

import { BaseAIModel } from "./baseModel";
import { AIModelProvider, AIModelRequest, AIModelResponse } from "../types";
import axios from "axios";

export class CustomModel extends BaseAIModel {
  constructor(id: string, name: string, config: any = {}) {
    super(id, name, AIModelProvider.CUSTOM, {
      apiKey: config.apiKey,
      baseUrl: config.endpoint,
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 1024,
      ...config,
    });
  }

  /**
   * Check if the custom model endpoint is available
   */
  async isAvailable(): Promise<boolean> {
    return !!this.config.baseUrl && !!this.config.apiKey;
  }

  /**
   * Generate a response using the custom model endpoint
   */
  async generateResponse(request: AIModelRequest): Promise<AIModelResponse> {
    try {
      const startTime = Date.now();

      // Prepare the request payload - this will need to be customized based on the API
      const payload = {
        model: this.id,
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

      // Send the request to the custom API endpoint
      const response = await axios.post(
        this.config.baseUrl as string,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: this.config.apiKey
              ? `Bearer ${this.config.apiKey}`
              : undefined,
            ...this.config.headers,
          },
          timeout: this.config.timeout || 30000,
        },
      );

      // Extract the response content - this will need to be customized based on the API response format
      let content = "";

      // Try to handle different response formats
      if (response.data.choices && response.data.choices[0]?.message?.content) {
        // OpenAI-like format
        content = response.data.choices[0].message.content;
      } else if (response.data.content) {
        // Simple format
        content = response.data.content;
      } else if (response.data.response) {
        // Another common format
        content = response.data.response;
      } else if (response.data.text) {
        // Yet another format
        content = response.data.text;
      } else if (typeof response.data === "string") {
        // Plain text response
        content = response.data;
      } else {
        // Fallback - stringify the whole response
        content = JSON.stringify(response.data);
      }

      // Calculate processing time
      const processingTime = (Date.now() - startTime) / 1000;

      return this.createResponse(content, {
        processingTime,
        rawResponse: response.data,
        endpoint: this.config.baseUrl,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
}
