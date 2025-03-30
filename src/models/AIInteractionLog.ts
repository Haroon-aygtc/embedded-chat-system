import { DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

class AIInteractionLog extends Model {
  public id!: string;
  public user_id!: string;
  public query!: string;
  public response!: string;
  public model_used!: string;
  public context_rule_id?: string;
  public knowledge_base_results?: number;
  public knowledge_base_ids?: string;
  public metadata?: Record<string, any>;
  public created_at!: Date;
}

export const initAIInteractionLog = async () => {
  const sequelize = await getMySQLClient();

  AIInteractionLog.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
      knowledge_base_results: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      knowledge_base_ids: {
        type: DataTypes.TEXT,
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
      tableName: "ai_interaction_logs",
      timestamps: false,
    },
  );

  return AIInteractionLog;
};

export default AIInteractionLog;
