# Component Reference

## Frontend Components

### Chat Components

#### ChatWidget

**Path**: `src/components/chat/ChatWidget.tsx`

The main container component for the chat widget. It orchestrates all chat functionality and manages the overall state of the chat interface.

**Props**:
- `initiallyOpen`: Boolean to determine if the widget starts in open state
- `contextMode`: Mode for context handling ("restricted", "open", "custom")
- `contextName`: Name of the context rule to apply
- `title`: Title displayed in the header
- `primaryColor`: Primary color for theming
- `position`: Position on the screen ("bottom-right", "bottom-left", "top-right", "top-left")
- `showOnMobile`: Whether to show the widget on mobile devices

**Key Functionality**:
- Manages the open/closed state of the widget
- Establishes WebSocket connection for real-time communication
- Coordinates between ChatHeader, ChatMessages, and ChatInput components
- Handles session management and persistence

#### ChatHeader

**Path**: `src/components/chat/ChatHeader.tsx`

Displays the title of the chat widget and provides controls for minimizing or closing the widget.

**Props**:
- `title`: Title text to display
- `onMinimize`: Function to call when minimize button is clicked
- `primaryColor`: Color for theming

#### ChatMessages

**Path**: `src/components/chat/ChatMessages.tsx`

Renders the conversation history with proper formatting for different message types.

**Props**:
- `messages`: Array of message objects
- `loading`: Boolean indicating if a response is being generated
- `primaryColor`: Color for theming

**Key Functionality**:
- Renders user and AI messages with appropriate styling
- Displays typing indicator when AI is generating a response
- Auto-scrolls to the latest message
- Supports markdown formatting in messages

#### ChatInput

**Path**: `src/components/chat/ChatInput.tsx`

Handles user input with support for text, attachments, and voice.

**Props**:
- `onSendMessage`: Function to call when a message is sent
- `disabled`: Boolean to disable input during processing
- `placeholder`: Placeholder text for the input field
- `primaryColor`: Color for theming
- `allowAttachments`: Whether to allow file attachments
- `allowVoice`: Whether to allow voice input

**Key Functionality**:
- Captures and submits user text input
- Handles file uploads if enabled
- Provides voice input capability if enabled

### Admin Components

#### ContextRulesEditor

**Path**: `src/components/admin/ContextRulesEditor.tsx`

Allows administrators to create and manage context rules that control AI responses.

**Key Functionality**:
- Create, edit, and delete context rules
- Define keywords and excluded topics for each rule
- Set preferred AI models for specific contexts
- Configure knowledge base integration

#### WidgetConfigurator

**Path**: `src/components/admin/WidgetConfigurator.tsx`

Provides a visual interface for configuring the appearance and behavior of the chat widget.

**Key Functionality**:
- Set widget position, size, and colors
- Configure initial state and behavior
- Preview changes in real-time
- Save configurations as presets

#### PromptTemplates

**Path**: `src/components/admin/PromptTemplates.tsx`

Manages reusable prompt templates for different conversation scenarios.

**Key Functionality**:
- Create and edit prompt templates
- Define variables for dynamic content
- Organize templates by category
- Test templates with sample inputs

#### EmbedCodeGenerator

**Path**: `src/components/admin/EmbedCodeGenerator.tsx`

Generates code snippets for embedding the chat widget in websites.

**Key Functionality**:
- Generate iframe embedding code
- Generate Web Component embedding code
- Customize embedding options
- Copy code to clipboard

#### AIInteractionLogs

**Path**: `src/components/admin/AIInteractionLogs.tsx`

Displays logs of AI interactions for monitoring and analysis.

**Key Functionality**:
- View user queries and AI responses
- Filter logs by date, model, and context
- Export logs for analysis
- Search for specific interactions

#### AIModelPerformance

**Path**: `src/components/admin/AIModelPerformance.tsx`

Provides analytics on AI model performance.

**Key Functionality**:
- Display model usage distribution
- Show response times and error rates
- Compare performance across models
- Analyze context rule effectiveness

## Backend Services

### Core Services

#### mysqlClient

**Path**: `src/services/mysqlClient.ts`

Provides a centralized client for MySQL database access.

**Key Functionality**:
- Establish and manage database connections
- Execute SQL queries with proper error handling
- Support transactions for atomic operations
- Provide a consistent interface for database operations

#### websocketService

**Path**: `src/services/websocketService.ts`

Manages WebSocket connections for real-time communication.

**Key Functionality**:
- Establish and maintain WebSocket connections
- Handle message sending and receiving
- Implement reconnection logic
- Manage connection state

#### realtimeService

**Path**: `src/services/realtimeService.ts`

Provides real-time updates using WebSockets.

**Key Functionality**:
- Subscribe to table changes
- Notify subscribers of changes
- Filter changes based on criteria
- Manage subscriptions

### Feature Services

#### aiService

**Path**: `src/services/aiService.ts`

Interfaces with AI models for generating responses.

**Key Functionality**:
- Send queries to AI models
- Process and format responses
- Apply context rules
- Cache responses for performance

#### authService

**Path**: `src/services/authService.ts`

Handles user authentication and authorization.

**Key Functionality**:
- User registration and login
- Password reset
- Session management
- Permission checking

#### chatService

**Path**: `src/services/chatService.ts`

Manages chat sessions and messages.

**Key Functionality**:
- Create and manage chat sessions
- Store and retrieve messages
- Handle real-time message delivery
- Maintain conversation context

#### moderationService

**Path**: `src/services/moderationService.ts`

Filters and moderates content.

**Key Functionality**:
- Check content against moderation rules
- Flag or block inappropriate content
- Manage moderation rules
- Handle user reporting

#### widgetConfigService

**Path**: `src/services/widgetConfigService.ts`

Manages widget configurations.

**Key Functionality**:
- Store and retrieve widget configurations
- Apply configuration changes
- Manage default configurations
- Handle configuration versioning

## Data Models

### User

**Path**: `src/models/User.ts`

Represents a user account.

**Fields**:
- `id`: UUID primary key
- `email`: User's email address
- `full_name`: User's full name
- `password_hash`: Hashed password
- `role`: User role (e.g., "user", "admin")
- `is_active`: Whether the user is active
- `avatar_url`: URL to user's avatar
- `last_login_at`: Timestamp of last login
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### ChatSession

**Path**: `src/models/ChatSession.ts`

Represents a chat conversation.

**Fields**:
- `id`: UUID primary key
- `session_id`: Unique session identifier
- `user_id`: ID of the user
- `context_rule_id`: ID of the applied context rule
- `is_active`: Whether the session is active
- `metadata`: Additional session data
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update
- `last_message_at`: Timestamp of last message

### ChatMessage

**Path**: `src/models/ChatMessage.ts`

Represents a single message in a conversation.

**Fields**:
- `id`: UUID primary key
- `session_id`: ID of the chat session
- `user_id`: ID of the user
- `content`: Message content
- `type`: Message type ("user", "system", "ai")
- `metadata`: Additional message data
- `status`: Message status
- `created_at`: Timestamp of creation

### WidgetConfig

**Path**: `src/models/WidgetConfig.ts`

Stores configuration for chat widgets.

**Fields**:
- `id`: UUID primary key
- `initially_open`: Whether the widget starts open
- `context_mode`: Context mode
- `context_name`: Name of the context
- `title`: Widget title
- `primary_color`: Primary color
- `position`: Widget position
- `show_on_mobile`: Whether to show on mobile
- `is_active`: Whether the config is active
- `is_default`: Whether this is the default config
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

### AIResponseCache

**Path**: `src/models/AIResponseCache.ts`

Caches AI responses for performance.

**Fields**:
- `id`: UUID primary key
- `cache_key`: Unique key for the cached response
- `query`: Original query
- `response`: AI response
- `model_used`: AI model used
- `metadata`: Additional response data
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update
- `expires_at`: Expiration timestamp
