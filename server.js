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

