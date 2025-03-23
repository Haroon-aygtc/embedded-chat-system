import { DataTypes, Model } from "sequelize";
import { getMySQLClient } from "@/services/mysqlClient";

class WidgetConfig extends Model {
  public id!: string;
  public initially_open!: boolean;
  public context_mode!: "restricted" | "open" | "custom";
  public context_name!: string;
  public title!: string;
  public primary_color!: string;
  public position!: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  public show_on_mobile!: boolean;
  public is_active!: boolean;
  public is_default!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

export const initWidgetConfig = async () => {
  const sequelize = await getMySQLClient();

  WidgetConfig.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      initially_open: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      context_mode: {
        type: DataTypes.ENUM("restricted", "open", "custom"),
        allowNull: false,
        defaultValue: "restricted",
      },
      context_name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Website Assistance",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Chat Widget",
      },
      primary_color: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "#4f46e5",
      },
      position: {
        type: DataTypes.ENUM(
          "bottom-right",
          "bottom-left",
          "top-right",
          "top-left",
        ),
        allowNull: false,
        defaultValue: "bottom-right",
      },
      show_on_mobile: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: "widget_configs",
      timestamps: false,
    },
  );

  return WidgetConfig;
};

export default WidgetConfig;
