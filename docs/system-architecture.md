# System Architecture Documentation

## Overview

This document provides a comprehensive overview of the Context-Aware Embeddable Chat System architecture. The system is designed as a lightweight, context-aware chat widget that can be embedded on any website or used as a standalone application, powered by AI models with comprehensive admin controls.

## System Components

The system is organized into several key components:

### 1. Frontend Components

#### 1.1 Chat Widget

The chat widget is the primary user interface component that can be embedded in any website:

- **ChatWidget**: Main container component that orchestrates all chat functionality
- **ChatHeader**: Displays title and controls for minimizing/closing the widget
- **ChatMessages**: Renders the conversation history with proper formatting
- **ChatInput**: Handles user input with support for text, attachments, and voice
- **TypingIndicator**: Shows when the AI is generating a response

#### 1.2 Admin Dashboard

The admin dashboard provides configuration and monitoring capabilities:

- **AnalyticsDashboard**: Displays usage statistics and performance metrics
- **ContextRulesEditor**: Manages context rules for controlling AI responses
- **PromptTemplates**: Manages reusable prompt templates for different scenarios
- **WidgetConfigurator**: Configures appearance and behavior of the chat widget
- **EmbedCodeGenerator**: Generates code snippets for embedding the widget
- **UserManagement**: Manages user accounts and permissions
- **ModerationQueue**: Reviews flagged content for moderation

#### 1.3 Embedding Options

The system supports multiple embedding methods:

- **IframeEmbed**: Standard iframe implementation for simple integration
- **WebComponentWrapper**: Shadow DOM implementation for more advanced integration

### 2. Backend Services

#### 2.1 Unified Server

The system uses a unified server architecture that combines all server components into a single process:

- **HTTP/Express Server**: Handles API requests and serves static files
- **WebSocket Server**: Manages real-time communication
- **Vite Dev Server**: Used in development mode only

#### 2.2 Core Services

- **MySQL Client**: Provides database access for persistent storage
- **WebSocket Service**: Handles real-time communication between clients and server
- **Realtime Service**: Manages subscriptions to real-time events

#### 2.3 Feature Services

- **AI Service**: Interfaces with AI models for generating responses
- **Auth Service**: Handles user authentication and authorization
- **Chat Service**: Manages chat sessions and messages
- **Knowledge Base Service**: Manages and queries knowledge base content
- **Moderation Service**: Filters and moderates content
- **Widget Config Service**: Manages widget configurations

### 3. Data Models

The system uses the following data models:

- **User**: Represents a user account
- **UserActivity**: Tracks user actions for analytics
- **ChatSession**: Represents a chat conversation
- **ChatMessage**: Represents a single message in a conversation
- **ContextRule**: Defines rules for controlling AI responses
- **WidgetConfig**: Stores configuration for chat widgets
- **AIResponseCache**: Caches AI responses for performance

## Data Flow

### 1. Chat Widget Interaction

1. User opens the chat widget on a website
2. WebSocket connection is established
3. User sends a message via ChatInput
4. Message is sent to the server via WebSocket
5. Server processes the message using context rules
6. AI generates a response
7. Response is sent back to the client via WebSocket
8. Response appears in the ChatMessages component

### 2. Admin Configuration

1. Admin logs into the dashboard
2. Admin configures context rules, prompt templates, or widget settings
3. Configuration is saved to the database
4. Changes are applied to the chat widget in real-time

## System Architecture Diagram

```
+----------------------------------+
|           Client Side            |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  |       Chat Widget          |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |     ChatHeader      |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |    ChatMessages     |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |      ChatInput      |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |     Admin Dashboard        |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  | ContextRulesEditor  |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |  WidgetConfigurator |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |  PromptTemplates   |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
              |   ^
              v   |
+----------------------------------+
|         Unified Server           |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  |     Express Server         |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |     WebSocket Server       |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |     Service Layer          |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |     AI Service      |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |    Auth Service     |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |    Chat Service     |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
              |   ^
              v   |
+----------------------------------+
|           Database               |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  |        MySQL               |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |      Users          |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |   ChatSessions      |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |   ChatMessages      |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |   ContextRules      |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  |  +---------------------+   |  |
|  |  |   WidgetConfigs     |   |  |
|  |  +---------------------+   |  |
|  |                            |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

## Key Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express, WebSockets (ws)
- **Database**: MySQL with Sequelize ORM
- **Real-time Communication**: WebSockets
- **AI Integration**: External AI models via API

## Deployment Architecture

The system is designed to be deployed as a single unified server that handles all aspects of the application:

1. **Development Mode**:
   - Unified server starts both the API server and WebSocket server
   - Vite dev server is started as a child process
   - All components communicate through local ports

2. **Production Mode**:
   - Unified server handles API requests, WebSocket connections, and serves static files
   - Static files are served from the `dist` directory
   - Single HTTP server instance for both REST API and static file serving

## Security Considerations

1. **Authentication**: JWT-based authentication for admin users
2. **Data Encryption**: Sensitive data is encrypted at rest and in transit
3. **Input Validation**: All user inputs are validated to prevent injection attacks
4. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
5. **Content Moderation**: User-generated content is moderated to prevent misuse

## Performance Optimization

1. **Response Caching**: AI responses are cached to improve performance
2. **Connection Management**: WebSocket connections use heartbeat mechanism for reliable connections
3. **Database Indexing**: Key database fields are indexed for faster queries
4. **Lazy Loading**: Admin dashboard components are lazy-loaded to improve initial load time

## Migration from Supabase to MySQL

The system has been migrated from Supabase to MySQL:

1. **Database Schema**: Migrated from Supabase tables to MySQL tables
2. **Authentication**: Replaced Supabase Auth with custom JWT-based authentication
3. **Real-time**: Replaced Supabase Realtime with WebSocket-based real-time communication
4. **Storage**: Replaced Supabase Storage with local file storage

## Embedding Options

The chat widget can be embedded in websites using two methods:

1. **Iframe Embedding**:
   ```html
   <iframe src="https://your-domain.com/chat-embed" width="380" height="600" frameborder="0"></iframe>
   ```

2. **Web Component Embedding**:
   ```html
   <script src="https://your-domain.com/chat-widget.js"></script>
   <chat-widget theme="light" position="bottom-right"></chat-widget>
   ```

## Configuration Options

The chat widget can be configured with the following options:

1. **Appearance**: Theme, colors, position, size
2. **Behavior**: Initial state, auto-open triggers, session timeout
3. **Context Rules**: Business domain limitations, response filtering
4. **Features**: Attachments, voice input, suggested responses

## Conclusion

The Context-Aware Embeddable Chat System provides a flexible, performant, and secure solution for embedding AI-powered chat functionality in any website. The unified server architecture simplifies deployment and maintenance, while the comprehensive admin controls allow for fine-tuning the chat experience to meet specific business needs.