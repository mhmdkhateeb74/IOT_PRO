const WebSocket = require("ws");
const express = require("express");
const path = require("path");
const http = require("http");

const httpPort = 4020;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map();

app.use(express.static(path.join(__dirname, "public")));


wss.on("connection", (ws) => {
  let clientId = null;
  console.log("New WebSocket connection");

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.id && data.status && !clientId) {
        clientId = data.id;
        clients.set(clientId, ws);
        console.log(Device ${clientId} connected with status: ${data.status});
        return;
      }

      if (data.id && data.status) {
        console.log(From ${data.id} → ${data.status});
        broadcastToWebClients(JSON.stringify(data));
      }
    } catch (e) {
      console.log("Error parsing message:", e.message);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected");
    if (clientId) clients.delete(clientId);
  });

 
  ws.send(JSON.stringify({ message: "Connected to server" }));
});


const webClients = new Set();

function broadcastToWebClients(data) {
  webClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

const htmlWss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/status") {
    htmlWss.handleUpgrade(req, socket, head, (ws) => {
      htmlWss.emit("connection", ws, req);
    });
  }
});


htmlWss.on("connection", (ws) => {
  webClients.add(ws);
  ws.on("close", () => webClients.delete(ws));

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      const target = clients.get(data.id);
      if (target && target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify(data));
        console.log(`Sent cancellation to ${data.id}`);
      }
    } catch (e) {
      console.log("HTML client error:", e.message);
    }
  });
});


server.listen(httpPort, () => {
  console.log(`HTTP server running on http://localhost:${httpPort}`);
});
