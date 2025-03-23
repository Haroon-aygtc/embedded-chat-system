import { DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

class ChatMessage extends Model {
  public id!: string;
  public session_id!: string;
  public user_id!: string;
  public content!: string;
  public type!: "user" | "system" | "ai";
  public metadata?: Record<string, any>;
  public status?: "pending" | "delivered" | "read" | "moderated";
  public created_at!: Date;
}

export const initChatMessage = async () => {
  const sequelize = await getMySQLClient();

  ChatMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      session_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "chat_sessions",
          key: "session_id",
        },
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("user", "system", "ai"),
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "delivered", "read", "moderated"),
        allowNull: true,
        defaultValue: "pending",
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: "chat_messages",
      timestamps: false,
    },
  );

  return ChatMessage;
};

export default ChatMessage;
