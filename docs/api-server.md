# API Server Documentation

## Overview

The API server provides RESTful endpoints for the chat application. It complements the WebSocket server by handling non-real-time operations such as fetching context rules, widget configurations, and chat history.

## Key Features

### REST API Endpoints

The API server provides the following endpoints:

#### Context Rules

- `GET /api/context-rules`: Get all context rules
- `GET /api/context-rules/:id`: Get a specific context rule
- `POST /api/context-rules`: Create a new context rule
- `PUT /api/context-rules/:id`: Update a context rule
- `DELETE /api/context-rules/:id`: Delete a context rule

#### Widget Configurations

- `GET /api/widget-configs`: Get all widget configurations
- `GET /api/widget-configs/:id`: Get a specific widget configuration
- `POST /api/widget-configs`: Create a new widget configuration
- `PUT /api/widget-configs/:id`: Update a widget configuration
- `DELETE /api/widget-configs/:id`: Delete a widget configuration

#### Chat History

- `GET /api/chat-history`: Get chat history with optional filtering by user_id and widget_id

#### Analytics

- `GET /api/analytics/overview`: Get an overview of analytics data

### Integration with Supabase

The API server uses Supabase as its database backend. It connects to Supabase using the `@supabase/supabase-js` client library and the environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

## Implementation Details

### Server Initialization

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
```

### Supabase Client Initialization

```javascript
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

### Error Handling

The API server includes comprehensive error handling:

1. **Try-Catch Blocks**: Each endpoint is wrapped in a try-catch block to handle errors
2. **Error Logging**: Errors are logged to the console with context
3. **Error Responses**: Appropriate HTTP status codes and error messages are returned to the client
4. **Global Error Handler**: A middleware function catches any unhandled errors

```javascript
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

### Graceful Shutdown

The API server implements graceful shutdown to handle process termination:

```javascript
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing API server');
  server.close(() => {
    console.log('API server closed');
    process.exit(0);
  });
});
```

## Usage Example

### Starting the API Server

The API server is automatically started by the unified server:

```javascript
// In server.js
startApiServer();
```

### Making API Requests

```javascript
// Fetch all context rules
fetch('http://localhost:3001/api/context-rules')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

// Create a new widget configuration
fetch('http://localhost:3001/api/widget-configs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Widget',
    primary_color: '#3b82f6',
    position: 'bottom-right',
    initial_state: 'minimized',
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Security Considerations

1. The current implementation uses CORS to allow cross-origin requests
2. In a production environment, consider adding proper authentication and authorization
3. The API server uses the Supabase service key, which has full access to the database
4. Consider implementing rate limiting to prevent abuse

## Potential Improvements

1. Add authentication and authorization middleware
2. Implement request validation using a library like Joi or express-validator
3. Add pagination for endpoints that return large datasets
4. Implement caching for frequently accessed data
5. Add more detailed analytics endpoints
6. Implement logging to a file or external service
