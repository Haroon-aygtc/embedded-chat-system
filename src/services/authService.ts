import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { User } from "@/models";
import logger from "@/utils/logger";
import { env } from "@/config/env";

// JWT configuration
const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = env.JWT_EXPIRES_IN;

/**
 * Authentication service for user management
 */
const authService = {
  /**
   * Register a new user
   * @param email User email
   * @param password User password
   * @param name User name (optional)
   * @returns Created user object
   */
  register: async (email: string, password: string, name?: string) => {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        id: uuidv4(),
        email,
        full_name: name || email.split("@")[0],
        role: "user",
        is_active: true,
        metadata: {
          passwordHash: hashedPassword,
        },
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Remove sensitive data before returning
      const userObj = user.get({ plain: true });
      delete userObj.metadata.passwordHash;

      return userObj;
    } catch (error) {
      logger.error("Error registering user", error);
      throw error;
    }
  },

  /**
   * Login a user
   * @param email User email
   * @param password User password
   * @returns User object and JWT token
   */
  login: async (email: string, password: string) => {
    try {
      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Check if user is active
      if (!user.is_active) {
        throw new Error("User account is disabled");
      }

      // Verify password
      const isMatch = await bcrypt.compare(
        password,
        user.metadata?.passwordHash || "",
      );

      if (!isMatch) {
        throw new Error("Invalid credentials");
      }

      // Update last login time
      await user.update({
        last_login_at: new Date(),
        updated_at: new Date(),
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      );

      // Remove sensitive data before returning
      const userObj = user.get({ plain: true });
      delete userObj.metadata.passwordHash;

      return {
        user: userObj,
        token,
        session: {
          access_token: token,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      };
    } catch (error) {
      logger.error("Error logging in user", error);
      throw error;
    }
  },

  /**
   * Logout the current user
   */
  logout: async () => {
    // With JWT, logout is handled client-side by removing the token
    return { success: true };
  },

  /**
   * Get the current authenticated user
   * @param userId User ID
   */
  getCurrentUser: async (userId: string) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return null;
      }

      // Remove sensitive data before returning
      const userObj = user.get({ plain: true });
      if (userObj.metadata?.passwordHash) {
        delete userObj.metadata.passwordHash;
      }

      return userObj;
    } catch (error) {
      logger.error("Error getting current user", error);
      return null;
    }
  },

  /**
   * Verify JWT token
   * @param token JWT token
   * @returns Decoded token payload
   */
  verifyToken: (token: string) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error("Error verifying token", error);
      throw new Error("Invalid token");
    }
  },

  /**
   * Request password reset
   * @param email User email
   * @returns Success status
   */
  requestPasswordReset: async (email: string) => {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        // Don't reveal that the user doesn't exist
        return { success: true };
      }

      // Generate reset token
      const resetToken = uuidv4();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Token valid for 1 hour

      // Update user metadata with reset token
      const metadata = {
        ...user.metadata,
        resetToken,
        resetExpires: resetExpires.toISOString(),
      };

      await user.update({
        metadata,
        updated_at: new Date(),
      });

      // In a real application, send an email with the reset link
      // For now, just log it
      logger.info(`Password reset token for ${email}: ${resetToken}`);

      return { success: true };
    } catch (error) {
      logger.error(`Error requesting password reset for ${email}`, error);
      throw error;
    }
  },

  /**
   * Reset password with token
   * @param token Reset token
   * @param newPassword New password
   * @returns Success status
   */
  resetPassword: async (token: string, newPassword: string) => {
    try {
      // Find user with this reset token
      const user = await User.findOne({
        where: {
          "metadata.resetToken": token,
        },
      });

      if (!user) {
        throw new Error("Invalid or expired reset token");
      }

      // Check if token is expired
      const resetExpires = new Date(user.metadata?.resetExpires || 0);
      if (resetExpires < new Date()) {
        throw new Error("Reset token has expired");
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user with new password and remove reset token
      const metadata = { ...user.metadata, passwordHash: hashedPassword };
      delete metadata.resetToken;
      delete metadata.resetExpires;

      await user.update({
        metadata,
        updated_at: new Date(),
      });

      return { success: true };
    } catch (error) {
      logger.error("Error resetting password", error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param userId User ID
   * @param updates User profile updates
   * @returns Updated user object
   */
  updateProfile: async (userId: string, updates: any) => {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Handle password update separately
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updates.password, salt);

        // Update metadata with new password hash
        const metadata = { ...user.metadata, passwordHash: hashedPassword };
        updates.metadata = metadata;
        delete updates.password;
      }

      // Add updated_at timestamp
      updates.updated_at = new Date();

      // Update user
      await user.update(updates);

      // Refresh user from database
      const updatedUser = await User.findByPk(userId);
      if (!updatedUser) {
        throw new Error("Failed to retrieve updated user");
      }

      // Remove sensitive data before returning
      const userObj = updatedUser.get({ plain: true });
      if (userObj.metadata?.passwordHash) {
        delete userObj.metadata.passwordHash;
      }

      return userObj;
    } catch (error) {
      logger.error(`Error updating user ${userId}`, error);
      throw error;
    }
  },

  /**
   * Check if a user has a specific role
   * @param userId User ID
   * @param role Role to check
   * @returns Boolean indicating if user has the role
   */
  hasRole: async (userId: string, role: string) => {
    try {
      const user = await User.findByPk(userId);
      return user?.role === role;
    } catch (error) {
      logger.error(`Error checking role for user ${userId}`, error);
      return false;
    }
  },
};

export default authService;
