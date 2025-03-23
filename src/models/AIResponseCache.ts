import { DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

class AIResponseCache extends Model {
  public id!: string;
  public cache_key!: string;
  public query!: string;
  public response!: string;
  public model_used!: string;
  public metadata!: Record<string, any>;
  public created_at!: Date;
  public updated_at!: Date;
  public expires_at!: Date;
}

export const initAIResponseCache = async () => {
  const sequelize = await getMySQLClient();

  AIResponseCache.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      cache_key: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
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
        type: DataTypes.STRING(50),
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
      tableName: "ai_response_cache",
      timestamps: false,
    },
  );

  return AIResponseCache;
};

export default AIResponseCache;
