/**
 * Mock models for client-side use
 *
 * This file provides browser-compatible mock implementations of the database models
 * to be used in client-side code instead of directly importing from src/models/index.ts
 */

// Mock User model
export class User {
  static findAll() {
    return Promise.resolve([]);
  }

  static findOne() {
    return Promise.resolve(null);
  }

  static findByPk() {
    return Promise.resolve(null);
  }

  static create() {
    return Promise.resolve({});
  }
}

// Mock ContextRule model
export class ContextRule {
  static findAll() {
    return Promise.resolve([]);
  }

  static findOne() {
    return Promise.resolve(null);
  }

  static findByPk() {
    return Promise.resolve(null);
  }

  static create() {
    return Promise.resolve({});
  }
}

// Mock WidgetConfig model
export class WidgetConfig {
  static findAll() {
    return Promise.resolve([]);
  }

  static findOne() {
    return Promise.resolve(null);
  }

  static findByPk() {
    return Promise.resolve(null);
  }

  static create() {
    return Promise.resolve({});
  }
}

// Mock SystemSetting model
export class SystemSetting {
  static findAll() {
    return Promise.resolve([]);
  }

  static findOne() {
    return Promise.resolve(null);
  }

  static findByPk() {
    return Promise.resolve(null);
  }

  static create() {
    return Promise.resolve({});
  }
}

// Export mock models
const models = {
  User,
  ContextRule,
  WidgetConfig,
  SystemSetting,
};

export default models;
