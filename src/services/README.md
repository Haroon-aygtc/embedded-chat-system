# Services Documentation

## Environment Variables

This project uses environment variables for configuration. The environment variables are loaded from the `.env` file in the root directory.

### Required Environment Variables

- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_SERVICE_KEY`: The service key for your Supabase project (server-side only)
- `VITE_SUPABASE_URL`: The URL of your Supabase project (client-side)
- `VITE_SUPABASE_ANON_KEY`: The anonymous key for your Supabase project (client-side)

### Optional Environment Variables

- `GEMINI_API_KEY`: The API key for Gemini AI (server-side)
- `VITE_GEMINI_API_KEY`: The API key for Gemini AI (client-side)
- `HUGGINGFACE_API_KEY`: The API key for Hugging Face (server-side)
- `VITE_HUGGINGFACE_API_KEY`: The API key for Hugging Face (client-side)
- `PORT`: The port for the Vite dev server (default: 5173)
- `API_PORT`: The port for the API server (default: 3001)
- `WS_PORT`: The port for the WebSocket server (default: 8080)
- `HOST`: The host for the servers (default: 0.0.0.0)

## Using Environment Variables

### In Client-Side Code

Use the `env` utility from `@/config/env`:

```typescript
import env from '@/config/env';

const supabaseUrl = env.SUPABASE_URL;
```

### In Server-Side Code

Use `process.env` directly or the `env` utility if imported:

```javascript
const supabaseUrl = process.env.SUPABASE_URL;
```

## Setting Up Environment Variables

1. Copy the `.env.example` file to `.env`
2. Fill in the required environment variables
3. Restart the development server

## Troubleshooting

### Missing Environment Variables

If you encounter errors related to missing environment variables, make sure:

1. You have created a `.env` file in the root directory
2. The `.env` file contains all required environment variables
3. You have restarted the development server after updating the `.env` file

### `spawn npm ENOENT` Error

This error indicates that npm is not in the system's PATH. To fix this:

1. Make sure npm is installed correctly
2. Add npm to your system's PATH
3. If using Docker, make sure npm is installed in the container

### `supabaseUrl is required` Error

This error indicates that the Supabase URL is not being loaded correctly. To fix this:

1. Make sure the `SUPABASE_URL` and `VITE_SUPABASE_URL` environment variables are set in your `.env` file
2. Make sure the `.env` file is being loaded correctly
3. Restart the development server after updating the `.env` file
