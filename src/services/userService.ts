import { User as AppUser } from "@/types/auth";
import { User, UserActivity } from "@/models";
import logger from "@/utils/logger";
import { getMySQLClient } from "./mysqlClient";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// Convert database user to our app's User type
const mapDatabaseUser = (user: User): AppUser => ({
  id: user.id,
  email: user.email,
  name: user.full_name || user.email.split("@")[0],
  role: user.role as "admin" | "user" | "moderator",
  avatar: user.avatar_url || undefined,
});

// User management service
export const userService = {
  // Get all users with pagination and filtering
  getUsers: async ({
    page = 1,
    pageSize = 10,
    searchTerm = "",
    roleFilter = null,
    statusFilter = null,
  }: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    roleFilter?: string | null;
    statusFilter?: string | null;
  }) => {
    try {
      const sequelize = getMySQLClient();
      const Op = sequelize.Op;

      // Build where clause
      const whereClause: any = {};

      if (searchTerm) {
        whereClause[Op.or] = [
          { email: { [Op.like]: `%${searchTerm}%` } },
          { full_name: { [Op.like]: `%${searchTerm}%` } },
        ];
      }

      if (roleFilter) {
        whereClause.role = roleFilter;
      }

      if (statusFilter) {
        whereClause.is_active = statusFilter === "active";
      }

      // Get total count
      const totalCount = await User.count({ where: whereClause });

      // Get users with pagination
      const users = await User.findAll({
        where: whereClause,
        order: [["created_at", "DESC"]],
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      return {
        users: users.map(mapDatabaseUser),
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      logger.error("Error fetching users:", error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<AppUser | null> => {
    try {
      const user = await User.findByPk(id);
      return user ? mapDatabaseUser(user) : null;
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },

  // Create a new user
  createUser: async ({
    email,
    name,
    role,
    isActive,
    password,
  }: {
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    password?: string;
  }): Promise<AppUser | null> => {
    try {
      // Hash password if provided
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Create user in database
      const newUser = await User.create({
        id: uuidv4(),
        email,
        full_name: name,
        role,
        is_active: isActive,
        password_hash: passwordHash,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return mapDatabaseUser(newUser);
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (
    id: string,
    {
      email,
      name,
      role,
      isActive,
    }: {
      email?: string;
      name?: string;
      role?: string;
      isActive?: boolean;
    },
  ): Promise<AppUser | null> => {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return null;
      }

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.full_name = name;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      await user.update(updateData);
      return mapDatabaseUser(user);
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      const result = await User.destroy({ where: { id } });
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Get user activity logs
  getUserActivity: async (userId: string) => {
    try {
      const activities = await UserActivity.findAll({
        where: { user_id: userId },
        order: [["created_at", "DESC"]],
        limit: 20,
      });

      return activities;
    } catch (error) {
      logger.error(`Error fetching activity for user ${userId}:`, error);
      return [];
    }
  },

  // Get user sessions
  getUserSessions: async (userId: string) => {
    try {
      const sequelize = getMySQLClient();
      // Query chat_sessions table instead of user_sessions
      const sessions = await sequelize.query(
        `SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC`,
        { replacements: [userId], type: sequelize.QueryTypes.SELECT },
      );

      return sessions;
    } catch (error) {
      logger.error(`Error fetching sessions for user ${userId}:`, error);
      return [];
    }
  },

  // Log user activity
  logUserActivity: async ({
    userId,
    action,
    ipAddress,
    userAgent,
    metadata = {},
  }: {
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      await UserActivity.create({
        id: uuidv4(),
        user_id: userId,
        action,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata,
        created_at: new Date(),
      });

      return true;
    } catch (error) {
      logger.error("Error logging user activity:", error);
      return false;
    }
  },

  // Authenticate a user
  authenticateUser: async (
    email: string,
    password: string,
  ): Promise<AppUser | null> => {
    try {
      const user = await User.findOne({ where: { email, is_active: true } });
      if (!user || !user.password_hash) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isPasswordValid) {
        return null;
      }

      // Update last login time
      await user.update({ last_login_at: new Date() });

      return mapDatabaseUser(user);
    } catch (error) {
      logger.error(`Error authenticating user ${email}:`, error);
      return null;
    }
  },
};

export default userService;
