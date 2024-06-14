
const { Server } = require('socket.io');
const io = new Server({
    cors: "*",
    methods: ["GET", "POST"]
})
const connectedClients = new Map();

io.on('connection', function (socket) {
    socket.on('mousePosition', (position) => {
        connectedClients.set(socket.id, position);
        const positions = Array.from(connectedClients.values());
        socket.broadcast.emit('mousePositions', positions);
        console.log(socket.id)
        console.log(positions)
    })
    socket.on('canvasImage', (data) => {
        socket.broadcast.emit('canvasImage', data);
    });
    socket.on('disconnect', () => {
        connectedClients.delete(socket.id);
        const positions = Array.from(connectedClients.values());
        socket.broadcast.emit('mousePositions', positions)
    })
});

const PORT = process.env.PORT || 3000

io.listen(PORT);
