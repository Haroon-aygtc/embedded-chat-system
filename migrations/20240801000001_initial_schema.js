/**
 * Initial database schema migration
 */

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      avatar_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "user",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create user_activities table
    await queryInterface.createTable("user_activities", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create context_rules table
    await queryInterface.createTable("context_rules", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      excluded_topics: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      preferred_model: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      use_knowledge_bases: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      response_filters: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create widget_configs table
    await queryInterface.createTable("widget_configs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      primary_color: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "#3b82f6",
      },
      position: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "bottom-right",
      },
      initial_state: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "minimized",
      },
      allow_attachments: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allow_voice: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      allow_emoji: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      context_mode: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "general",
      },
      context_rule_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "context_rules",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      welcome_message: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "How can I help you today?",
      },
      placeholder_text: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Type your message here...",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create chat_sessions table
    await queryInterface.createTable("chat_sessions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      widget_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "widget_configs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "active",
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create chat_messages table
    await queryInterface.createTable("chat_messages", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "chat_sessions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "text",
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create ai_response_cache table
    await queryInterface.createTable("ai_response_cache", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      prompt_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      model_used: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create ai_interaction_logs table
    await queryInterface.createTable("ai_interaction_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      query: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      model_used: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      context_rule_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "context_rules",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create system_settings table
    await queryInterface.createTable("system_settings", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      environment: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "development",
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes
    await queryInterface.addIndex("ai_response_cache", ["prompt_hash"], {
      unique: true,
    });
    await queryInterface.addIndex("ai_response_cache", ["model_used"]);
    await queryInterface.addIndex("ai_response_cache", ["expires_at"]);
    await queryInterface.addIndex(
      "system_settings",
      ["category", "environment"],
      {
        unique: true,
      },
    );
    await queryInterface.addIndex("chat_messages", ["session_id"]);
    await queryInterface.addIndex("chat_messages", ["user_id"]);
    await queryInterface.addIndex("chat_sessions", ["user_id"]);
    await queryInterface.addIndex("chat_sessions", ["widget_id"]);
    await queryInterface.addIndex("user_activities", ["user_id"]);
    await queryInterface.addIndex("ai_interaction_logs", ["user_id"]);
    await queryInterface.addIndex("ai_interaction_logs", ["context_rule_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable("ai_interaction_logs");
    await queryInterface.dropTable("ai_response_cache");
    await queryInterface.dropTable("chat_messages");
    await queryInterface.dropTable("chat_sessions");
    await queryInterface.dropTable("widget_configs");
    await queryInterface.dropTable("context_rules");
    await queryInterface.dropTable("user_activities");
    await queryInterface.dropTable("system_settings");
    await queryInterface.dropTable("users");
  },
};
