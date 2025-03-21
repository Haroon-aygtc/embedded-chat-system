/**
 * Unified server starter
 * Starts both the Vite dev server and WebSocket server
 */
const { spawn } = require("child_process");
const path = require("path");

// Configuration
const VITE_PORT = process.env.PORT || 5173;
const WS_PORT = process.env.WS_PORT || 8080;

// Start WebSocket server
const wsServer = spawn("node", ["server/websocket-server.js"], {
  env: { ...process.env, PORT: WS_PORT },
  stdio: "pipe",
});

console.log(`\x1b[36m[WebSocket] Starting server on port ${WS_PORT}...\x1b[0m`);

wsServer.stdout.on("data", (data) => {
  console.log(`\x1b[36m[WebSocket] ${data.toString().trim()}\x1b[0m`);
});

wsServer.stderr.on("data", (data) => {
  console.error(`\x1b[31m[WebSocket Error] ${data.toString().trim()}\x1b[0m`);
});

// Start Vite dev server
const viteServer = spawn("npm", ["run", "dev", "--", "--port", VITE_PORT], {
  stdio: "pipe",
});

console.log(
  `\x1b[35m[Vite] Starting dev server on port ${VITE_PORT}...\x1b[0m`,
);

viteServer.stdout.on("data", (data) => {
  console.log(`\x1b[35m[Vite] ${data.toString().trim()}\x1b[0m`);
});

viteServer.stderr.on("data", (data) => {
  console.error(`\x1b[31m[Vite Error] ${data.toString().trim()}\x1b[0m`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\x1b[33mShutting down all servers...\x1b[0m");
  wsServer.kill();
  viteServer.kill();
  process.exit(0);
});

// Handle server process exits
wsServer.on("close", (code) => {
  console.log(`\x1b[36m[WebSocket] Server exited with code ${code}\x1b[0m`);
});

viteServer.on("close", (code) => {
  console.log(`\x1b[35m[Vite] Server exited with code ${code}\x1b[0m`);
});
