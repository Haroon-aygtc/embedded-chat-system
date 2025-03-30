import logger from "@/utils/logger";
import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import { WidgetConfig as WidgetConfigType } from "@/models";

export interface WidgetConfig {
  id?: string;
  initiallyOpen: boolean;
  contextMode: "restricted" | "open" | "custom";
  contextName: string;
  title: string;
  primaryColor: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showOnMobile?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Service for managing widget configurations
 */
export const widgetConfigService = {
  /**
   * Get the default active widget configuration
   */
  getDefaultWidgetConfig: async (): Promise<WidgetConfig> => {
    try {
      const sequelize = await getMySQLClient();

      const [result] = await sequelize.query(
        `SELECT * FROM widget_configs 
         WHERE is_active = true AND is_default = true 
         ORDER BY updated_at DESC LIMIT 1`,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (result) {
        // Convert from snake_case to camelCase
        return {
          id: (result as any).id,
          initiallyOpen: (result as any).initially_open || false,
          contextMode: (result as any).context_mode || "restricted",
          contextName: (result as any).context_name || "Website Assistance",
          title: (result as any).title || "Chat Widget",
          primaryColor: (result as any).primary_color || "#4f46e5",
          position: (result as any).position || "bottom-right",
          showOnMobile:
            (result as any).show_on_mobile !== undefined
              ? (result as any).show_on_mobile
              : true,
          isActive: (result as any).is_active,
          isDefault: (result as any).is_default,
          createdAt: (result as any).created_at
            ? new Date((result as any).created_at)
            : undefined,
          updatedAt: (result as any).updated_at
            ? new Date((result as any).updated_at)
            : undefined,
        };
      }

      // If no configuration found in database, throw an error
      throw new Error("No active widget configuration found in database");
    } catch (error) {
      logger.error("Error fetching widget configuration from MySQL", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  },

  /**
   * Create a new widget configuration
   */
  createWidgetConfig: async (
    config: Omit<WidgetConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<WidgetConfig> => {
    try {
      const sequelize = await getMySQLClient();

      // Convert from camelCase to snake_case for database
      const [result] = await sequelize.query(
        `INSERT INTO widget_configs 
         (id, initially_open, context_mode, context_name, title, primary_color, position, show_on_mobile, is_active, is_default, created_at, updated_at) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            config.initiallyOpen,
            config.contextMode,
            config.contextName,
            config.title,
            config.primaryColor,
            config.position || "bottom-right",
            config.showOnMobile !== undefined ? config.showOnMobile : true,
            config.isActive !== undefined ? config.isActive : true,
            config.isDefault !== undefined ? config.isDefault : false,
          ],
          type: sequelize.QueryTypes.INSERT,
        },
      );

      // Get the newly created config
      const [newConfig] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = LAST_INSERT_ID()`,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (newConfig) {
        return {
          id: (newConfig as any).id,
          initiallyOpen: (newConfig as any).initially_open,
          contextMode: (newConfig as any).context_mode,
          contextName: (newConfig as any).context_name,
          title: (newConfig as any).title,
          primaryColor: (newConfig as any).primary_color,
          position: (newConfig as any).position,
          showOnMobile: (newConfig as any).show_on_mobile,
          isActive: (newConfig as any).is_active,
          isDefault: (newConfig as any).is_default,
          createdAt: new Date((newConfig as any).created_at),
          updatedAt: new Date((newConfig as any).updated_at),
        };
      }

      throw new Error("Failed to create widget configuration");
    } catch (error) {
      logger.error("Error creating widget configuration", error);
      throw error;
    }
  },

  /**
   * Update an existing widget configuration
   */
  updateWidgetConfig: async (
    id: string,
    config: Partial<WidgetConfig>,
  ): Promise<WidgetConfig> => {
    try {
      const sequelize = await getMySQLClient();

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const replacements = [];

      if (config.initiallyOpen !== undefined) {
        updateFields.push("initially_open = ?");
        replacements.push(config.initiallyOpen);
      }

      if (config.contextMode !== undefined) {
        updateFields.push("context_mode = ?");
        replacements.push(config.contextMode);
      }

      if (config.contextName !== undefined) {
        updateFields.push("context_name = ?");
        replacements.push(config.contextName);
      }

      if (config.title !== undefined) {
        updateFields.push("title = ?");
        replacements.push(config.title);
      }

      if (config.primaryColor !== undefined) {
        updateFields.push("primary_color = ?");
        replacements.push(config.primaryColor);
      }

      if (config.position !== undefined) {
        updateFields.push("position = ?");
        replacements.push(config.position);
      }

      if (config.showOnMobile !== undefined) {
        updateFields.push("show_on_mobile = ?");
        replacements.push(config.showOnMobile);
      }

      if (config.isActive !== undefined) {
        updateFields.push("is_active = ?");
        replacements.push(config.isActive);
      }

      if (config.isDefault !== undefined) {
        updateFields.push("is_default = ?");
        replacements.push(config.isDefault);
      }

      // Always update the updated_at timestamp
      updateFields.push("updated_at = NOW()");

      // Add the ID to the replacements
      replacements.push(id);

      if (updateFields.length > 0) {
        await sequelize.query(
          `UPDATE widget_configs SET ${updateFields.join(", ")} WHERE id = ?`,
          {
            replacements,
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      }

      // Get the updated config
      const [updatedConfig] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (updatedConfig) {
        return {
          id: (updatedConfig as any).id,
          initiallyOpen: (updatedConfig as any).initially_open,
          contextMode: (updatedConfig as any).context_mode,
          contextName: (updatedConfig as any).context_name,
          title: (updatedConfig as any).title,
          primaryColor: (updatedConfig as any).primary_color,
          position: (updatedConfig as any).position,
          showOnMobile: (updatedConfig as any).show_on_mobile,
          isActive: (updatedConfig as any).is_active,
          isDefault: (updatedConfig as any).is_default,
          createdAt: new Date((updatedConfig as any).created_at),
          updatedAt: new Date((updatedConfig as any).updated_at),
        };
      }

      throw new Error(`Widget configuration with ID ${id} not found`);
    } catch (error) {
      logger.error(`Error updating widget configuration with ID ${id}`, error);
      throw error;
    }
  },

  /**
   * Get all widget configurations
   */
  getAllWidgetConfigs: async (): Promise<WidgetConfig[]> => {
    try {
      const sequelize = await getMySQLClient();

      const results = await sequelize.query(
        `SELECT * FROM widget_configs ORDER BY updated_at DESC`,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return results.map((result: any) => ({
        id: result.id,
        initiallyOpen: result.initially_open,
        contextMode: result.context_mode,
        contextName: result.context_name,
        title: result.title,
        primaryColor: result.primary_color,
        position: result.position,
        showOnMobile: result.show_on_mobile,
        isActive: result.is_active,
        isDefault: result.is_default,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at),
      }));
    } catch (error) {
      logger.error("Error fetching all widget configurations", error);
      throw error;
    }
  },

  /**
   * Delete a widget configuration
   */
  deleteWidgetConfig: async (id: string): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();

      const [result] = await sequelize.query(
        `DELETE FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.DELETE,
        },
      );

      return (result as any)?.affectedRows > 0;
    } catch (error) {
      logger.error(`Error deleting widget configuration with ID ${id}`, error);
      throw error;
    }
  },
};

export default widgetConfigService;
