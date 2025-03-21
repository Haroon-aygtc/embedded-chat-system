# AI Service Configuration

## Required Environment Variables

To use the AI service with real API connections, you need to set the following environment variables:

### Gemini API
- `VITE_GEMINI_API_KEY`: Your Google Gemini API key
- `VITE_GEMINI_ENDPOINT` (optional): Custom endpoint URL (defaults to "https://generativelanguage.googleapis.com")

### Hugging Face API
- `VITE_HUGGINGFACE_API_KEY`: Your Hugging Face API key
- `VITE_HUGGINGFACE_ENDPOINT` (optional): Custom endpoint URL (defaults to "https://api-inference.huggingface.co/models")
- `VITE_HUGGINGFACE_MODEL` (optional): Specific model to use (defaults to "mistralai/Mistral-7B-Instruct-v0.2")

## Getting API Keys

### Gemini API Key
1. Go to https://ai.google.dev/
2. Sign up or log in to your Google account
3. Navigate to the API section and create a new API key
4. Copy the API key and set it as the `VITE_GEMINI_API_KEY` environment variable

### Hugging Face API Key
1. Go to https://huggingface.co/
2. Sign up or log in to your Hugging Face account
3. Navigate to your profile settings and create a new API token
4. Copy the API token and set it as the `VITE_HUGGINGFACE_API_KEY` environment variable

## Error Handling

The AI service includes fallback mechanisms:
- If the primary model fails, it will attempt to use the secondary model
- If both models fail, it will return an error message

Ensure you have at least one valid API key configured for production use.
