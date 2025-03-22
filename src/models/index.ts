import { Sequelize, DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

const sequelize = getMySQLClient();

// Define models

// User model
export class User extends Model {
  declare id: string;
  declare email: string;
  declare full_name?: string;
  declare avatar_url?: string;
  declare role: string;
  declare is_active: boolean;
  declare metadata?: any;
  declare last_login_at?: Date;
  declare created_at: Date;
  declare updated_at: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "user",
    tableName: "users",
    timestamps: false,
  },
);

// User Activity model
export class UserActivity extends Model {
  declare id: string;
  declare user_id: string;
  declare action: string;
  declare ip_address?: string;
  declare user_agent?: string;
  declare metadata?: any;
  declare created_at: Date;
}

UserActivity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "user_activity",
    tableName: "user_activities",
    timestamps: false,
  },
);

// Context Rules model
export class ContextRule extends Model {
  declare id: string;
  declare name: string;
  declare description?: string;
  declare content: string;
  declare is_active: boolean;
  declare priority: number;
  declare excluded_topics?: string[];
  declare preferred_model?: string;
  declare use_knowledge_bases: boolean;
  declare response_filters?: any[];
  declare created_at: Date;
  declare updated_at: Date;
}

ContextRule.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    excluded_topics: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    preferred_model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    use_knowledge_bases: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    response_filters: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "context_rule",
    tableName: "context_rules",
    timestamps: false,
  },
);

// Widget Config model
export class WidgetConfig extends Model {
  declare id: string;
  declare name: string;
  declare primary_color: string;
  declare position: string;
  declare initial_state: string;
  declare allow_attachments: boolean;
  declare allow_voice: boolean;
  declare allow_emoji: boolean;
  declare context_mode: string;
  declare context_rule_id?: string;
  declare welcome_message: string;
  declare placeholder_text: string;
  declare created_at: Date;
  declare updated_at: Date;
}

WidgetConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    primary_color: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "#3b82f6",
    },
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "bottom-right",
    },
    initial_state: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "minimized",
    },
    allow_attachments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allow_voice: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    allow_emoji: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    context_mode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "general",
    },
    context_rule_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "context_rules",
        key: "id",
      },
    },
    welcome_message: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "How can I help you today?",
    },
    placeholder_text: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Type your message here...",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "widget_config",
    tableName: "widget_configs",
    timestamps: false,
  },
);

// Chat Session model
export class ChatSession extends Model {
  declare id: string;
  declare user_id?: string;
  declare widget_id?: string;
  declare status: string;
  declare metadata?: any;
  declare created_at: Date;
  declare updated_at: Date;
}

ChatSession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    widget_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "widget_configs",
        key: "id",
      },
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "chat_session",
    tableName: "chat_sessions",
    timestamps: false,
  },
);

// Chat Message model
export class ChatMessage extends Model {
  declare id: string;
  declare session_id: string;
  declare user_id?: string;
  declare content: string;
  declare type: string;
  declare metadata?: any;
  declare created_at: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    session_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "chat_sessions",
        key: "id",
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "text",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "chat_message",
    tableName: "chat_messages",
    timestamps: false,
  },
);

// AI Response Cache model
export class AIResponseCache extends Model {
  declare id: string;
  declare prompt: string;
  declare prompt_hash: string;
  declare response: string;
  declare model_used: string;
  declare metadata?: any;
  declare created_at: Date;
  declare updated_at: Date;
  declare expires_at: Date;
}

AIResponseCache.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    prompt_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    model_used: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ai_response_cache",
    tableName: "ai_response_cache",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["prompt_hash"],
      },
      {
        fields: ["model_used"],
      },
      {
        fields: ["expires_at"],
      },
    ],
  },
);

// AI Interaction Logs model
export class AIInteractionLog extends Model {
  declare id: string;
  declare user_id: string;
  declare query: string;
  declare response: string;
  declare model_used: string;
  declare context_rule_id?: string;
  declare metadata?: any;
  declare created_at: Date;
}

AIInteractionLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    model_used: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    context_rule_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "context_rules",
        key: "id",
      },
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "ai_interaction_log",
    tableName: "ai_interaction_logs",
    timestamps: false,
  },
);

// System Settings model
export class SystemSetting extends Model {
  declare id: string;
  declare category: string;
  declare environment: string;
  declare settings: any;
  declare created_at: Date;
  declare updated_at: Date;
}

SystemSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    environment: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "development",
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "system_setting",
    tableName: "system_settings",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["category", "environment"],
      },
    ],
  },
);

// Define associations
User.hasMany(UserActivity, { foreignKey: "user_id" });
UserActivity.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ChatSession, { foreignKey: "user_id" });
ChatSession.belongsTo(User, { foreignKey: "user_id" });

WidgetConfig.hasMany(ChatSession, { foreignKey: "widget_id" });
ChatSession.belongsTo(WidgetConfig, { foreignKey: "widget_id" });

ContextRule.hasMany(WidgetConfig, { foreignKey: "context_rule_id" });
WidgetConfig.belongsTo(ContextRule, { foreignKey: "context_rule_id" });

ChatSession.hasMany(ChatMessage, { foreignKey: "session_id" });
ChatMessage.belongsTo(ChatSession, { foreignKey: "session_id" });

User.hasMany(ChatMessage, { foreignKey: "user_id" });
ChatMessage.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(AIInteractionLog, { foreignKey: "user_id" });
AIInteractionLog.belongsTo(User, { foreignKey: "user_id" });

ContextRule.hasMany(AIInteractionLog, { foreignKey: "context_rule_id" });
AIInteractionLog.belongsTo(ContextRule, { foreignKey: "context_rule_id" });

// Export models
const models = {
  User,
  UserActivity,
  ContextRule,
  WidgetConfig,
  ChatSession,
  ChatMessage,
  AIResponseCache,
  AIInteractionLog,
  SystemSetting,
};

export default models;
