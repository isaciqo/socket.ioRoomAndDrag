const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    // Ouvinte de evento para entrada em uma sala
    socket.on('join', (room) => {
        socket.join(room); // Coloca o usuário na sala especificada
    });

    // Ouvinte de evento para mensagens de chat
    socket.on('chat message', (room, message) => {
        // Envia a mensagem para todos os usuários na sala especificada
        console.log('teste');
        console.log('a mensagem foi', message);
        io.to(room).emit('chat message', message);
        
    });

    // socket.on("object move", (room, data) => {
    //     console.log('estou recebendo informação de move');
    //     io.to(room).emit("objectMoved", data);
    //     console.log('estou recebendo enviei informação para objectMoved');
    // });

    socket.on('object move', (room, coordinates) => {
        console.log('estou recebendo informação de move');
        io.to(room).emit('object move', coordinates.left, coordinates.top);
    });

    // Ouvinte de evento para desconexão de um usuário
    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });

});

server.listen(3000, () => {
    console.log('Servidor escutando na porta 3000');
});
