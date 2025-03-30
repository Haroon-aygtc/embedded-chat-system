# API Middleware Architecture

## Overview

This directory contains the API middleware layer that serves as the interface between the frontend and various backend services. The middleware provides a standardized way to make API requests, handle responses, and manage errors.

## Key Features

- **Technology-agnostic**: Works with any backend (Node.js, Laravel, etc.)
- **Standardized responses**: All API responses follow a consistent format
- **Authentication**: JWT/OAuth authentication is handled automatically
- **Error handling**: Comprehensive error handling and logging
- **Caching**: Optional response caching for improved performance
- **Retry logic**: Automatic retry for failed requests
- **Mock responses**: Support for mock responses in development

## Directory Structure

```
api/
├── middleware/
│   └── apiMiddleware.ts     # Core middleware implementation
├── endpoints/
│   ├── index.ts             # Exports all endpoint modules
│   ├── authEndpoints.ts     # Authentication endpoints
│   ├── chatEndpoints.ts     # Chat-related endpoints
│   ├── userEndpoints.ts     # User management endpoints
│   └── ...                  # Other endpoint modules
└── README.md                # This file
```

## Usage

### Basic Usage

```typescript
import { api } from '@/services/api/middleware/apiMiddleware';

// Make a GET request
const response = await api.get('/users');

// Make a POST request
const newUser = await api.post('/users', { name: 'John Doe', email: 'john@example.com' });

// Make a PUT request
const updatedUser = await api.put('/users/123', { name: 'Jane Doe' });

// Make a DELETE request
const deleteResult = await api.delete('/users/123');
```

### Using Endpoint Modules

```typescript
import { userEndpoints } from '@/services/api/endpoints';

// Get all users
const users = await userEndpoints.getUsers();

// Get a specific user
const user = await userEndpoints.getUserById('123');

// Create a new user
const newUser = await userEndpoints.createUser({
  email: 'john@example.com',
  name: 'John Doe',
  role: 'user',
  isActive: true,
});
```

### Advanced Options

```typescript
import { api } from '@/services/api/middleware/apiMiddleware';

// With caching (cache for 60 seconds)
const cachedResponse = await api.get('/users', { cacheDuration: 60 });

// Skip authentication for public endpoints
const publicData = await api.get('/public-data', { skipAuth: true });

// With mock response for development/testing
const mockResponse = await api.get('/users', {
  mockResponse: [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Doe' },
  ],
});
```

## Response Format

All API responses follow this standard format:

```typescript
interface ApiResponse<T = any> {
  success: boolean;        // Whether the request was successful
  data?: T;                // The response data (if successful)
  error?: {                // Error information (if unsuccessful)
    code: string;          // Error code
    message: string;       // Error message
    details?: any;         // Additional error details
  };
  meta?: {                 // Metadata about the response
    pagination?: {         // Pagination information (if applicable)
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
    timestamp: string;     // When the response was generated
    requestId: string;     // Unique ID for request tracing
  };
}
```

## Error Handling

Errors are automatically caught and transformed into a standardized format. You can handle them like this:

```typescript
try {
  const response = await api.get('/users');
  if (response.success) {
    // Handle successful response
    const users = response.data;
  } else {
    // Handle error
    console.error(`Error: ${response.error.code} - ${response.error.message}`);
  }
} catch (error) {
  // Handle unexpected errors
  console.error('Unexpected error:', error);
}
```

## Authentication

The middleware automatically adds authentication headers to requests if a token is available in localStorage. You can skip authentication for specific requests using the `skipAuth` option.

## Caching

You can enable caching for specific requests using the `cacheDuration` option. The cache is stored in memory and is cleared when the page is refreshed.

```typescript
// Cache for 60 seconds
const response = await api.get('/users', { cacheDuration: 60 });

// Clear the entire cache
api.clearCache();

// Clear cache for a specific endpoint
api.clearCacheFor('GET', '/users');
```
