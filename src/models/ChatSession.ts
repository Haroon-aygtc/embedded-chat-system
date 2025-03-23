import { DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

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

export default ChatSession;
