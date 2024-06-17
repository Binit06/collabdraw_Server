const express = require('express');
const http = require('http');
const {WebSocket, WebSocketServer} = require('ws')
const { v4 : uuidv4 } = require('uuid')
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

//I am using clients dictionary to maintain all the clients
const clients = {};
//I am using users dictionary to maintain all the users
const users = {};
//The current imageURL is maintained here
let imageURL = null;
//User Activity History
const userActivity = [];

const typeDef = {
    USER_EVENT: 'userevent',
    CANVAS_EVENT: 'canvasChange'
}
function broadcastMessage(json) {
    //We will be sending the current data to all the clients
    const data = JSON.stringify(json)
    for (let userId in clients) {
        let client = clients[userId];
        if(client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    }
}

function handleMessage(message, userId) {
    const dataFromClient = JSON.parse(message.toString());
    const json = {type: dataFromClient.type}
    if(dataFromClient.type === typeDef.USER_EVENT) {
        if(dataFromClient.username){
            users[userId] = dataFromClient;
            userActivity.push(`${dataFromClient.username} joined to edit the canvas`)
            json.data = {users, userActivity}
        } else {
            handleDisconnect(userId)
        }
    } else if (dataFromClient.type === typeDef.CANVAS_EVENT){
        canvasContent = dataFromClient.content;
        imageURL = canvasContent
        json.data = {canvasContent, userActivity}
    }

    broadcastMessage(json)
}

function handleDisconnect(userId) {
    console.log(`${userId} disconnected`);
    const json = {type: typeDef.USER_EVENT};
    const username = users[userId]?.username || userId;
    userActivity.push(`${username} left the canvas`);
    json.data = { users, userActivity }
    delete clients[userId];
    delete users[userId];
    broadcastMessage(json)
}

wsServer.on('connection', function (connection) {
    const userId = uuidv4();
    clients[userId] = connection;
    if (imageURL) {
        const json = {type: typeDef.CANVAS_EVENT};
        json.data = {canvasContent: imageURL, userActivity}
        connection.send(JSON.stringify(json));
    }
    connection.on('message', (message) => {
        handleMessage(message, userId);
    });
    connection.on('close', () => {
        handleDisconnect(userId);
    });
    connection.on('error', () => {
        handleDisconnect(userId);
    });
    console.log(`${userId} connected`);
    const json = {type: typeDef.USER_EVENT};
    json.data = {users, userActivity}
    broadcastMessage(json)
})

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
    console.log(`Server and WebSocket is running on port ${PORT}`);
});
