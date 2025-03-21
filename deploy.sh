#!/bin/bash

# Production deployment script

set -e

echo "Starting deployment process..."

# Build the application
echo "Building the application..."
npm run build

# Build Docker image
echo "Building Docker image..."
docker build -t chat-widget:latest .

# Tag the image for your registry
# Replace with your actual registry details
echo "Tagging Docker image..."
docker tag chat-widget:latest your-registry.com/chat-widget:latest

# Push to registry
# Uncomment and modify for your registry
# echo "Pushing Docker image to registry..."
# docker push your-registry.com/chat-widget:latest

echo "Deployment build completed successfully!"
echo "To run the container locally:"
echo "docker run -p 3000:3000 -p 8080:8080 -e SUPABASE_URL=your-url -e SUPABASE_ANON_KEY=your-key chat-widget:latest"

echo ""
echo "For production deployment, make sure to set these environment variables:"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_KEY"
echo "- SUPABASE_PROJECT_ID"
echo "- VITE_SUPABASE_URL"
echo "- VITE_SUPABASE_ANON_KEY"
