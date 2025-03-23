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
          { full_name: { [Op.like]: `%${searchTerm}%` } }
        ];
      }
      
      if (roleFilter) {
        whereClause.role = roleFilter;
      }
      
      if (statusFilter) {
        whereClause.is_active = statusFilter === "active";
      }

