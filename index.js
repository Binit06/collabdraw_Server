const express = require('express');
const http = require('http');
const WebSocket = require('ws')
const { v4 : uuidv4 } = require('uuid')
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connectedClients = {};

wss.on('connection', function (socket, req) {
    const urlParts = req.url.split('?');
    if (urlParts.length < 2) {
        console.log('Connection Rejected: No Username Provided');
        socket.close();
        return;
    }
    const queryParams = new URLSearchParams(urlParts[1]);
    const username = queryParams.get('username');
    console.log(username)

    if (!username) {
        console.log('Connection Rejected: No Username Provided');
        socket.close()
        return;
    }

    if (connectedClients[username]) {
        console.log('User Already Exist Please try a different username');
        socket.close();
        return;
    }

    connectedClients[username] = socket;

    console.log(`New Web Socket Connected for Username ${username}`)

    broadcastOnlineUsers();

    socket.on('message', (data) => {
        try {
            const parsedData = JSON.parse(data);

            if(parsedData.type === 'canvasImage') {
                Object.keys(connectedClients).forEach((username) => {
                    const connection = connectedClients[username];
                    const message = JSON.stringify(parsedData);
                    if(connection !== socket && connection.readyState === WebSocket.OPEN) {
                        connection.send(message)
                    }
                    console.log(username)
                })
            } else if (parsedData.type === 'mousePoisition') {
                console.log(`Received Mouse Position for ${connectedClients.get(socket).id}: `, parsedData.packet);
            } else {
                console.log(`Received Unrecognized Data :`, parsedData);
            }
        } catch (error) {
            console.error(`Error Parsing Message : `, error);
        }
    })

    socket.on('close', (ws) => {
        delete connectedClients[username];
        console.log(`Web Socket connections closed for username ${username}`)
        broadcastOnlineUsers();
        socket.terminate();
    });
});

function broadcastOnlineUsers() {
    const onlineUsers = Object.keys(connectedClients);
    const message = JSON.stringify({
        type: 'onlineUsers',
        users: onlineUsers
    });
    console.log(onlineUsers)

    onlineUsers.map((value) => {
        const connection = connectedClients[value];
        console.log(connection)
        connection.send(message);
    });
}

app.use(cors({
    origin: "*",
    mthods: ["GET", "POST"],
    allowedHeaders: ["content-type"]
}));

app.get('/', (req, res) => {
    res.send('Socket.IO server is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
