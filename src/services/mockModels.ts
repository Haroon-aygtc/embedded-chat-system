/**
 * DEPRECATED: This file is no longer used and should not be imported.
 * All data should come from real MySQL database connections.
 */

import logger from "@/utils/logger";

// Log a warning if this file is imported
logger.error(
  "mockModels.ts is deprecated and should not be used. Use real MySQL data instead.",
);

// Throw an error if any function is called
const errorMessage = "Mock models are deprecated. Use real MySQL data instead.";

// Export empty interfaces to prevent TypeScript errors during migration
export interface ContextRule {}
export interface WidgetConfig {}
export interface SystemSetting {}
export interface User {}

// Export functions that throw errors when called
export const findAll = async () => {
  throw new Error(errorMessage);
};

export const findByPk = async (id: string) => {
  throw new Error(errorMessage);
};

export const findOne = async (options: any) => {
  throw new Error(errorMessage);
};

export const create = async (data: any) => {
  throw new Error(errorMessage);
};

export const update = async (data: any) => {
  throw new Error(errorMessage);
};

export const destroy = async () => {
  throw new Error(errorMessage);
};

// Export a mock models object that throws errors when used
const models = new Proxy(
  {},
  {
    get: function () {
      throw new Error(errorMessage);
    },
  },
);

export default models;
