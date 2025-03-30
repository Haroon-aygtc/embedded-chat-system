import axios from "axios";
import {
  ResponseFormat,
  ApplyFormatParams,
  CreateFormatParams,
  UpdateFormatParams,
} from "@/types/responseFormat";
import logger from "@/utils/logger";

const API_URL = "/api/response-formats";

const responseFormatService = {
  /**
   * Get all response formats
   */
  getAllFormats: async (): Promise<ResponseFormat[]> => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      logger.error("Error fetching response formats:", error);
      // For now, return an empty array if the API fails
      return [];
    }
  },

  /**
   * Get a response format by ID
   */
  getFormatById: async (id: string): Promise<ResponseFormat | null> => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching response format ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new response format
   */
  createFormat: async (
    data: CreateFormatParams,
  ): Promise<ResponseFormat | null> => {
    try {
      const response = await axios.post(API_URL, data);
      return response.data;
    } catch (error) {
      logger.error("Error creating response format:", error);
      return null;
    }
  },

  /**
   * Update an existing response format
   */
  updateFormat: async (
    id: string,
    data: UpdateFormatParams,
  ): Promise<ResponseFormat | null> => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      logger.error(`Error updating response format ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a response format
   */
  deleteFormat: async (id: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting response format ${id}:`, error);
      return false;
    }
  },

  /**
   * Apply a response format to content
   */
  applyFormat: async (params: ApplyFormatParams): Promise<string> => {
    try {
      const response = await axios.post(`${API_URL}/apply`, params);
      return response.data.result;
    } catch (error) {
      logger.error("Error applying response format:", error);
      return "Error: Failed to apply format";
    }
  },

  /**
   * Get formats by context rule ID
   */
  getFormatsByContextRule: async (
    contextRuleId: string,
  ): Promise<ResponseFormat[]> => {
    try {
      const response = await axios.get(
        `${API_URL}/context-rule/${contextRuleId}`,
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching formats for context rule ${contextRuleId}:`,
        error,
      );
      return [];
    }
  },
};

export default responseFormatService;
