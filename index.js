const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const connectedClients = new Map();

// Socket.IO connection handling
io.on('connection', function (socket) {
    socket.on('mousePosition', (position) => {
        connectedClients.set(socket.id, position);
        const positions = Array.from(connectedClients.values());
        socket.broadcast.emit('mousePositions', positions);
        console.log(socket.id);
        console.log(positions);
    });

    socket.on('canvasImage', (data) => {
        socket.broadcast.emit('canvasImage', data);
    });

    socket.on('disconnect', () => {
        connectedClients.delete(socket.id);
        const positions = Array.from(connectedClients.values());
        socket.broadcast.emit('mousePositions', positions);
    });
});

// Use CORS middleware to allow all requests from all origins
app.use(cors({
    origin: "*",
    mthods: ["GET", "POST"],
    allowedHeaders: ["content-type"]
}));

// Express route handling
app.get('/', (req, res) => {
    res.send('Socket.IO server is running');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
