# Context-Aware Embeddable Chat System

## Overview

This project is a lightweight, context-aware chat widget that can be embedded on any website or used as a standalone application. It's powered by Gemini and Hugging Face AI models with comprehensive admin controls.

## Features

- Responsive chat interface with both iframe and Web Component embedding options
- Context-based response filtering configurable to limit responses to specific business domains
- Real-time messaging system with user history management using WebSockets
- Intuitive admin panel for managing context rules, prompt templates, and business configurations
- Security with proper authentication, data encryption, and performance optimization

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Development

Start the development server with WebSocket support:

```bash
npm run dev:all
```

This will start:
- Vite dev server for the frontend
- WebSocket server for real-time communication

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
NODE_ENV=production node server.js
```

## Architecture

The application consists of several key components:

1. **Frontend Application**: React-based UI with admin dashboard and chat widget
2. **WebSocket Server**: Handles real-time communication
3. **Supabase Integration**: Provides database, authentication, and serverless functions

For detailed documentation on the server configuration, see [Server Configuration Documentation](./docs/server-configuration.md).

For WebSocket service documentation, see [WebSocket Service Documentation](./docs/websocket-service.md).

## Embedding Options

### iframe Embedding

```html
<iframe src="https://your-domain.com/chat-embed" width="400" height="600" frameborder="0"></iframe>
```

### Web Component (Shadow DOM)

```html
<script src="https://your-domain.com/chat-widget.js"></script>
<chat-widget position="bottom-right" primary-color="#4f46e5"></chat-widget>
```

## Configuration

The chat widget can be configured through the admin dashboard or directly via props when embedding:

- `position`: Position on the page (bottom-right, bottom-left, top-right, top-left)
- `primaryColor`: Main color for the widget
- `initiallyOpen`: Whether the widget starts in expanded state
- `contextMode`: "general" or "restricted" for domain-specific responses
- `contextRuleId`: ID of the context rule to apply (if in restricted mode)

## Development

### Project Structure

- `src/`: Frontend application source code
- `server/`: Server-side code including WebSocket server
- `supabase/`: Supabase migrations and functions
- `public/`: Static assets

### Key Technologies

- React + TypeScript
- Vite for frontend building
- Tailwind CSS for styling
- WebSocket for real-time communication
- Supabase for backend services
- Framer Motion for animations

## License

This project is licensed under the MIT License - see the LICENSE file for details.
