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
        const roomData = rooms[room] || { messages: [], objects: [], imagens: []};
        socket.emit('console.log', roomData.messages, roomData.objects, roomData.imagens);
    });

    // Ouvinte de evento para mensagens de chat
    socket.on('chat message', (room, message) => {
        // Envia a mensagem para todos os usuários na sala especificada
        // Garante que rooms[room] está inicializado antes de acessar messages
        rooms[room] = rooms[room] || { messages: [], objects: [], imagens: [] };

        
        io.to(room).emit('chat message', message);
        
        // Adiciona a mensagem à lista de mensagens da sala
        rooms[room].messages.push(message);
    });

    socket.on('Create box', (room, quadradoID) => {

         // Garante que rooms[room] está inicializado antes de acessar messages
        rooms[room] = rooms[room] || { messages: [], objects: [], imagens: [] };
        io.to(room).emit('Create box', quadradoID);

        rooms[room].objects.push({ elementID: quadradoID, position: { x: 0, y: 0 } });
    });

    socket.on('save estate', (room, objectInformation) => {

        rooms[room].objects = rooms[room].objects.map(object => 
            object.elementID === parseInt(objectInformation.elementID) ? { ...object, position: { x: objectInformation.left, y: objectInformation.top } } : object
          );
       
       
   });


    socket.on('delete object', (room, elementID) => {
        // Remove o objeto da lista de objetos da sala

        rooms[room].objects.splice(rooms[room].objects.findIndex(item => item.elementID === parseInt(elementID)), 1);
        


        io.to(room).emit('delete object', elementID);
        
    });

    socket.on('any object move', (room, coordinates, userID) => {
        io.to(room).except(userID).emit('any object move', coordinates.left, coordinates.top, coordinates.elementID);

    });

    socket.on('any object Resizing', (room, size, userID) => {

        io.to(room).except(userID).emit('any object Resizing', size.width, size.height, size.elementID);

    });

    // Ouvir evento para mudança da imagem de fundo
    socket.on('changeBackground', (room, newBackground) => {
        
        rooms[room].imagens.push(newBackground);
        // Emitir o evento para todos os clientes na sala
        io.to(room).emit('backgroundChanged', newBackground);
    });


    // Ouvir evento para mudar a imagem do jogador
    socket.on('uploadImage', (room, quadradoID, imageData) => {
        // Aqui você pode salvar a imagem em algum lugar ou transmiti-la para outros clientes
        io.to(room).emit('updateObjectImage', quadradoID, imageData);
    });

    // Ouvinte de evento para desconexão de um usuário
    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });

});
server.listen(3000, () => {
    console.log('Servidor escutando na porta 3000');
});
