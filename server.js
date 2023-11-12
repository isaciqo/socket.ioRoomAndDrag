const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));
const rooms = {}; // Inicializa a variável rooms
io.on('connection', (socket) => {
    console.log('Novo usuário conectado');

    // Ouvinte de evento para entrada em uma sala
    socket.on('join', (room) => {
        socket.join(room); // Coloca o usuário na sala especificada

        // Emite o evento 'initial state' com as mensagens e objetos iniciais
        const roomData = rooms[room] || { messages: [], objects: [] };
        socket.emit('console.log', roomData.messages, roomData.objects);
    });

    // Ouvinte de evento para mensagens de chat
    socket.on('chat message', (room, message) => {
        // Envia a mensagem para todos os usuários na sala especificada
        // Garante que rooms[room] está inicializado antes de acessar messages
        rooms[room] = rooms[room] || { messages: [], objects: [] };

        
        io.to(room).emit('chat message', message);
        
        // Adiciona a mensagem à lista de mensagens da sala
        rooms[room].messages.push(message);
        console.log('a mensagem foi array', rooms[room].messages );
    });

    socket.on('Create box', (room, quadradoID) => {

         // Garante que rooms[room] está inicializado antes de acessar messages
        rooms[room] = rooms[room] || { messages: [], objects: [] };
        io.to(room).emit('Create box', quadradoID);

        rooms[room].objects.push({ elementID: quadradoID, position: { x: 0, y: 0 } });
        console.log('o objeto foi array', rooms[room].objects );
    });

    socket.on('save estate', (room, objectInformation) => {

        rooms[room].objects = rooms[room].objects.map(object => 
            object.elementID === parseInt(objectInformation.elementID) ? { ...object, position: { x: objectInformation.left, y: objectInformation.top } } : object
          );
       
        console.log('rooms[room].objects', rooms[room].objects);
       
   });


    socket.on('delete object', (room, elementID) => {

        // Remove o objeto da lista de objetos da sala
        rooms[room].objects.splice(rooms[room].objects.indexOf(parseInt(elementID)), 1);
        

        console.log("depois de excluir de excluir", rooms[room].objects )

        io.to(room).emit('delete object', elementID);
        
    });

    socket.on('any object move', (room, coordinates, userID) => {
        io.to(room).except(userID).emit('any object move', coordinates.left, coordinates.top, coordinates.elementID);

    });

    // Ouvinte de evento para desconexão de um usuário
    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });

});
server.listen(3000, () => {
    console.log('Servidor escutando na porta 3000');
});
