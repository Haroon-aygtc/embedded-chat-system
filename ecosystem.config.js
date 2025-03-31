module.exports = {
  apps: [
    {
      name: "chat-widget-server",
      script: "server/server.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5173,
        API_PORT: 3001,
        WS_PORT: 8080,
      },
    },
  ],
};
