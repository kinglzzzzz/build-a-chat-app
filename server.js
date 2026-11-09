import http from 'http';
import fs from 'fs';
import WebSocket, { WebSocketServer } from 'ws';

const PORT = 3001;

const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const isScript = pathname === "/script.js";

    const filePath = isScript ? "./public/script.js" : "./public/index.html";

    fs.readFile(filePath, (err,data) => {
        if(err){
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.end("Internal Server Error");
            return;
        }

        res.writeHead(200, {"Content-Type": isScript ? "text/javascript":"text/html"});
        res.end(data);
    });
});


const wss = new WebSocketServer({ server });

function broadcast(message){
    const data = JSON.stringify(message);

    wss.clients.forEach((client) => {
        if(client.readyState === WebSocket.OPEN){
            client.send(data);
        }
    });
}

wss.on("connection", (socket,req) => {
    const username = new URL(req.url, "http://localhost").searchParams.get("username");

    broadcast({
        type: "system",
        text: `${username} joined`
    });

    socket.on("message", (data) => {
        let message;

        try{
            message = JSON.parse(data.toString());
        }catch(err){
            console.error("Invalid JSON:", err.message);
            return;
        }

        broadcast({
            type:"chat",
            username: message.username,
            text:message.text
        })
    });

    socket.on("close", () => {
        broadcast({
            type: "system",
            text: `${username} left`
        });
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`)
});