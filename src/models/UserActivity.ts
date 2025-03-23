import { DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

class UserActivity extends Model {
  public id!: string;
  public user_id!: string;
  public action!: string;
  public ip_address?: string;
  public user_agent?: string;
  public metadata?: Record<string, any>;
  public created_at!: Date;
}

export const initUserActivity = async () => {
  const sequelize = await getMySQLClient();

  UserActivity.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
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
      tableName: "user_activity",
      timestamps: false,
    },
  );

  return UserActivity;
};

export default UserActivity;
