# API Server Architecture

## Overview

This directory contains the server-side implementation of the API that serves as the backend for the application. The API follows RESTful principles and provides endpoints for authentication, chat, user management, and more.

## Key Features

- **RESTful API**: Follows REST principles for resource management
- **JWT Authentication**: Secure authentication using JSON Web Tokens
- **Role-based Authorization**: Different access levels based on user roles
- **Standardized Responses**: Consistent response format across all endpoints
- **Error Handling**: Comprehensive error handling and logging
- **Validation**: Input validation for all endpoints

## Directory Structure

```
api/
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── validation.js       # Input validation middleware
│   └── errorHandler.js     # Error handling middleware
├── routes/
│   ├── index.js            # Main router configuration
│   ├── authRoutes.js       # Authentication routes
│   ├── chatRoutes.js       # Chat-related routes
│   ├── userRoutes.js       # User management routes
│   └── ...                 # Other route modules
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── chatController.js   # Chat-related logic
│   ├── userController.js   # User management logic
│   └── ...                 # Other controller modules
└── README.md               # This file
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/logout` - Logout the current user
- `GET /api/auth/me` - Get the current authenticated user
- `POST /api/auth/forgot-password` - Request a password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

### Chat

- `POST /api/chat/sessions` - Create a new chat session
- `GET /api/chat/sessions` - Get all chat sessions for the current user
- `GET /api/chat/sessions/:id` - Get a chat session by ID
- `PUT /api/chat/sessions/:id` - Update a chat session
- `POST /api/chat/messages` - Send a message in a chat session
- `GET /api/chat/sessions/:id/messages` - Get messages for a chat session
- `GET /api/chat/messages/:id` - Get a message by ID
- `POST /api/chat/sessions/:id/read` - Mark messages as read

### Users

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get a user by ID
- `POST /api/users` - Create a new user (admin only)
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (admin only)
- `GET /api/users/:id/activity` - Get user activity logs
- `GET /api/users/:id/sessions` - Get user sessions

### Context Rules

- `GET /api/context-rules` - Get all context rules
- `GET /api/context-rules/:id` - Get a context rule by ID
- `POST /api/context-rules` - Create a new context rule
- `PUT /api/context-rules/:id` - Update a context rule
- `DELETE /api/context-rules/:id` - Delete a context rule
- `POST /api/context-rules/:id/test` - Test a context rule against a query

### Knowledge Base

- `GET /api/knowledge-base/configs` - Get all knowledge base configurations
- `GET /api/knowledge-base/configs/:id` - Get a knowledge base configuration by ID
- `POST /api/knowledge-base/configs` - Create a new knowledge base configuration
- `PUT /api/knowledge-base/configs/:id` - Update a knowledge base configuration
- `DELETE /api/knowledge-base/configs/:id` - Delete a knowledge base configuration
- `POST /api/knowledge-base/query` - Query knowledge bases
- `POST /api/knowledge-base/configs/:id/sync` - Sync a knowledge base

### Widget Configurations

- `GET /api/widget-configs` - Get all widget configurations
- `GET /api/widget-configs/user/:userId` - Get widget configurations for a user
- `GET /api/widget-configs/:id` - Get a widget configuration by ID
- `POST /api/widget-configs` - Create a new widget configuration
- `PUT /api/widget-configs/:id` - Update a widget configuration
- `DELETE /api/widget-configs/:id` - Delete a widget configuration

### AI

- `POST /api/ai/generate` - Generate a response using AI
- `GET /api/ai/logs` - Get AI interaction logs (admin only)
- `GET /api/ai/performance` - Get AI model performance metrics (admin only)

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,          // Whether the request was successful
  "data": {},              // The response data (if successful)
  "error": {               // Error information (if unsuccessful)
    "code": "ERR_CODE",    // Error code
    "message": "Error message", // Error message
    "details": {}          // Additional error details
  },
  "meta": {                // Metadata about the response
    "pagination": {        // Pagination information (if applicable)
      "page": 1,
      "pageSize": 10,
      "totalItems": 100,
      "totalPages": 10
    },
    "timestamp": "2023-06-01T12:00:00Z", // When the response was generated
    "requestId": "req_123"  // Unique ID for request tracing
  }
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes and a standardized error format:

- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Rate Limiting

The API implements rate limiting to prevent abuse. The current limits are:

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users

When the rate limit is exceeded, the API returns a `429 Too Many Requests` response.
