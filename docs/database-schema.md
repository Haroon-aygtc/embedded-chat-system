# Database Schema

## Overview

This document describes the database schema for the Context-Aware Embeddable Chat System. The system uses MySQL as its database, with Sequelize as the ORM layer.

## Tables

### users

Stores user account information.

```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url VARCHAR(255),
  last_login_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### user_activity

Tracks user actions for analytics.

```sql
CREATE TABLE IF NOT EXISTS user_activity (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### chat_sessions

Stores chat conversation sessions.

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  context_rule_id VARCHAR(36),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (context_rule_id) REFERENCES context_rules(id)
);
```

### chat_messages

Stores individual messages in chat conversations.

```sql
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('user', 'system', 'ai') NOT NULL,
  metadata JSON,
  status ENUM('pending', 'delivered', 'read', 'moderated'),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### context_rules

Defines rules for controlling AI responses.

```sql
CREATE TABLE IF NOT EXISTS context_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  context_type VARCHAR(50) NOT NULL,
  keywords JSON,
  excluded_topics JSON,
  prompt_template TEXT,
  response_filters JSON,
  use_knowledge_bases BOOLEAN DEFAULT FALSE,
  knowledge_base_ids JSON,
  preferred_model VARCHAR(50),
  version INT DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### widget_configs

Stores configuration for chat widgets.

```sql
CREATE TABLE IF NOT EXISTS widget_configs (
  id VARCHAR(36) PRIMARY KEY,
  initially_open BOOLEAN NOT NULL DEFAULT FALSE,
  context_mode ENUM('restricted', 'open', 'custom') NOT NULL DEFAULT 'restricted',
  context_name VARCHAR(255) NOT NULL DEFAULT 'Website Assistance',
  title VARCHAR(255) NOT NULL DEFAULT 'Chat Widget',
  primary_color VARCHAR(50) NOT NULL DEFAULT '#4f46e5',
  position ENUM('bottom-right', 'bottom-left', 'top-right', 'top-left') NOT NULL DEFAULT 'bottom-right',
  show_on_mobile BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### ai_response_cache

Caches AI responses for performance.

```sql
CREATE TABLE IF NOT EXISTS ai_response_cache (
  id VARCHAR(36) PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
);
```

### ai_interaction_logs

Logs AI interactions for monitoring and analysis.

```sql
CREATE TABLE IF NOT EXISTS ai_interaction_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_used VARCHAR(50) NOT NULL,
  context_rule_id VARCHAR(36),
  knowledge_base_results INT,
  knowledge_base_ids TEXT,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (context_rule_id) REFERENCES context_rules(id)
);
```

### prompt_templates

Stores reusable prompt templates.

```sql
CREATE TABLE IF NOT EXISTS prompt_templates (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  variables JSON,
  category VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### knowledge_base_configs

Stores knowledge base configurations.

```sql
CREATE TABLE IF NOT EXISTS knowledge_base_configs (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_type ENUM('file', 'url', 'text') NOT NULL,
  content TEXT,
  url VARCHAR(255),
  file_path VARCHAR(255),
  embedding_model VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### moderation_rules

Defines rules for content moderation.

```sql
CREATE TABLE IF NOT EXISTS moderation_rules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern TEXT NOT NULL,
  action ENUM('flag', 'block', 'replace') NOT NULL DEFAULT 'flag',
  replacement TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### flagged_content

Stores content flagged for moderation.

```sql
CREATE TABLE IF NOT EXISTS flagged_content (
  id VARCHAR(36) PRIMARY KEY,
  content_id VARCHAR(36) NOT NULL,
  content_type ENUM('message', 'user', 'attachment') NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reported_by VARCHAR(36) NOT NULL,
  reviewed_by VARCHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);
```

### user_bans

Stores user ban information.

```sql
CREATE TABLE IF NOT EXISTS user_bans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  banned_by VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (banned_by) REFERENCES users(id)
);
```

### api_keys

Stores API keys for external services.

```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### api_key_usage

Tracks API key usage.

```sql
CREATE TABLE IF NOT EXISTS api_key_usage (
  id VARCHAR(36) PRIMARY KEY,
  service VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  response_time_ms INT NOT NULL,
  status_code INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### notifications

Stores user notifications.

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Entity Relationship Diagram

```
+---------------+       +-------------------+
|    users      |       |  user_activity    |
+---------------+       +-------------------+
| id            |<----->| id                |
| email         |       | user_id           |
| full_name     |       | action            |
| password_hash |       | ip_address        |
| role          |       | user_agent        |
| is_active     |       | metadata          |
| avatar_url    |       | created_at        |
| last_login_at |       +-------------------+
| created_at    |
| updated_at    |
+---------------+
       |                +-------------------+
       |                |  chat_sessions    |
       |                +-------------------+
       +--------------->| id                |
       |                | session_id        |
       |                | user_id           |
       |                | context_rule_id   |
       |                | is_active         |
       |                | metadata          |
       |                | created_at        |
       |                | updated_at        |
       |                | last_message_at   |
       |                +-------------------+
       |                        |
       |                        v
       |                +-------------------+
       |                |  chat_messages    |
       +--------------->+-------------------+
                        | id                |
                        | session_id        |
                        | user_id           |
                        | content           |
                        | type              |
                        | metadata          |
                        | status            |
                        | created_at        |
                        +-------------------+

+---------------+       +-------------------+
| context_rules |       |  widget_configs   |
+---------------+       +-------------------+
| id            |       | id                |
| name          |       | initially_open    |
| description   |       | context_mode      |
| is_active     |       | context_name      |
| context_type  |       | title             |
| keywords      |       | primary_color     |
| excluded_topics|      | position          |
| prompt_template|      | show_on_mobile    |
| response_filters|     | is_active         |
| use_knowledge_bases|  | is_default        |
| knowledge_base_ids|   | created_at        |
| preferred_model|      | updated_at        |
| version       |       +-------------------+
| created_at    |
| updated_at    |
+---------------+

+---------------+       +-------------------+
|ai_response_cache|     | ai_interaction_logs|
+---------------+       +-------------------+
| id            |       | id                |
| cache_key     |       | user_id           |
| query         |       | query             |
| response      |       | response          |
| model_used    |       | model_used        |
| metadata      |       | context_rule_id   |
| created_at    |       | knowledge_base_results|
| updated_at    |       | knowledge_base_ids|
| expires_at    |       | metadata          |
+---------------+       | created_at        |
                        +-------------------+
```

## Sequelize Models

The database schema is represented in the application using Sequelize models.

### User Model

```typescript
class User extends Model {
  public id!: string;
  public email!: string;
  public full_name!: string;
  public password_hash?: string;
  public role!: string;
  public is_active!: boolean;
  public avatar_url?: string;
  public last_login_at?: Date;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initUser = async () => {
  const sequelize = await getMySQLClient();

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password_hash: {
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
      avatar_url: {
        type: DataTypes.STRING,
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
      tableName: "users",
      timestamps: false,
    },
  );

  return User;
};
```

### ChatSession Model

```typescript
class ChatSession extends Model {
  public id!: string;
  public session_id!: string;
  public user_id!: string;
  public context_rule_id?: string;
  public is_active!: boolean;
  public metadata?: Record<string, any>;
  public created_at!: Date;
  public updated_at!: Date;
  public last_message_at!: Date;
}

export const initChatSession = async () => {
  const sequelize = await getMySQLClient();

  ChatSession.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      session_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      context_rule_id: {
        type: DataTypes.UUID,
        allowNull: true,
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
      last_message_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "chat_sessions",
      timestamps: false,
    },
  );

  return ChatSession;
};
```

## Model Associations

The models are associated with each other to represent relationships in the database.

```typescript
export const initializeModels = async () => {
  try {
    // Initialize models
    await Promise.all([
      initUser(),
      initUserActivity(),
      initChatSession(),
      initChatMessage(),
      initWidgetConfig(),
      initAIResponseCache(),
    ]);

    // Define associations
    User.hasMany(UserActivity, { foreignKey: "user_id" });
    UserActivity.belongsTo(User, { foreignKey: "user_id" });

    User.hasMany(ChatSession, { foreignKey: "user_id" });
    ChatSession.belongsTo(User, { foreignKey: "user_id" });

    ChatSession.hasMany(ChatMessage, {
      foreignKey: "session_id",
      sourceKey: "session_id",
    });
    ChatMessage.belongsTo(ChatSession, {
      foreignKey: "session_id",
      targetKey: "session_id",
    });

    console.log("All models initialized successfully");
  } catch (error) {
    console.error("Error initializing models:", error);
    throw error;
  }
};
```

## Migration from Supabase

The system has been migrated from Supabase to MySQL. The migration involved:

1. Creating equivalent MySQL tables for Supabase tables
2. Migrating data from Supabase to MySQL
3. Updating the application code to use MySQL instead of Supabase

The migration scripts are located in the `supabase/migrations` directory, with the most recent ones focusing on removing Supabase dependencies:

- `20240801000001_fix_supabase_references.sql`
- `20240802000001_remove_supabase_dependencies.sql`
- `20240803000001_ai_cache_table.sql`
- `20240803000002_knowledge_base_query_logs.sql`
- `20240901000001_cleanup_unused_tables.sql`

## MySQL Client

The application uses a centralized MySQL client for database access:

```typescript
export const getMySQLClient = async (): Promise<SequelizeLike> => {
  // For browser environments, return the dummy implementation
  if (isBrowser) {
    return dummySequelize;
  }

  if (!sequelize) {
    return await initMySQL();
  }
  return sequelize;
};
```

The MySQL client is initialized with proper error handling and retry logic:

```typescript
export const initMySQL = async (): Promise<SequelizeLike> => {
  // For browser environments, return the dummy implementation
  if (isBrowser) {
    return dummySequelize;
  }

  if (!sequelize) {
    // Server-side initialization
    try {
      // Dynamically import Sequelize only on the server side
      const { Sequelize } = await import("sequelize");

      const mysqlUrl = env.MYSQL_URL;
      const mysqlUser = env.MYSQL_USER;
      const mysqlPassword = env.MYSQL_PASSWORD;
      const mysqlDatabase = env.MYSQL_DATABASE;

      if (!mysqlUrl && (!mysqlUser || !mysqlPassword || !mysqlDatabase)) {
        throw new Error("MySQL connection details are required");
      }

      if (mysqlUrl) {
        // Use connection URL if provided
        sequelize = new Sequelize(mysqlUrl, {
          logging: env.NODE_ENV === "development" ? console.log : false,
          dialect: "mysql",
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        });
      } else {
        // Use individual connection parameters
        sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
          host: env.MYSQL_HOST || "localhost",
          port: parseInt(env.MYSQL_PORT || "3306"),
          dialect: "mysql",
          logging: env.NODE_ENV === "development" ? console.log : false,
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        });
      }

      // Test the connection
      await sequelize.authenticate();
      logger.info("MySQL client initialized and connected successfully");
    } catch (error) {
      logger.error("Failed to initialize MySQL client", error);
      throw error;
    }
  }

  return sequelize;
};
```
