// client.js
// Inicializa o cliente Socket.IO
const socket = io();
const roomNameInput = document.getElementById('roomName');
const joinCreateRoomButton = document.getElementById('joinCreateRoom');
let isDragging;
let offsetX, offsetY;

// Define um ouvinte de evento para o botão "Entrar na Sala ou Criar"
joinCreateRoomButton.addEventListener('click', () => {
    // Obtém o nome da sala inserido pelo usuário
    const roomName = roomNameInput.value.trim();
    if (roomName) {
        // Emite o evento "join" com o nome da sala
        socket.emit('join', roomName);
        // Desativa o campo de entrada e o botão após entrar na sala
        roomNameInput.disabled = true;
        joinCreateRoomButton.disabled = true;
    }
});

const messages = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

// Define um ouvinte de evento para o botão "Enviar"
sendButton.addEventListener('click', () => {
    // Obtém a mensagem digitada pelo usuário
    const message = messageInput.value;
    if (message) {
        // Emite o evento "chat message" com o nome da sala e a mensagem
        socket.emit('chat message', roomNameInput.value, message);
        messageInput.value = ''; // Limpa o campo de mensagem
    }
});

// Define um ouvinte de evento para receber mensagens do servidor e exibi-las
socket.on('chat message', (message) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
});

// código do objeto
// reconhendo que o objeto é objeto definido no html
const objeto = document.getElementById("objeto");




// Verifica se o evento ocorreu no objeto
objeto.addEventListener("mousedown", function(event) {
    if (event.target === objeto) { 
        isDragging = true;
        offsetX = event.clientX - objeto.getBoundingClientRect().left;
        offsetY = event.clientY - objeto.getBoundingClientRect().top;
    }
});

// ajustar local do objeto e enviar a informação 
objeto.addEventListener("mousemove", function(event) {
    if (isDragging) {
        const x = event.clientX - offsetX;
        const y = event.clientY - offsetY;
        objeto.style.left = x + "px";
        objeto.style.top = y + "px";
        socket.emit('object move', roomNameInput.value, {
            left: objeto.style.left,
            top: objeto.style.top
        });
        console.log('estou enviando informação para move');
        console.log('isMoving');
    }
});

// soltar o objeto
objeto.addEventListener("mouseup", function() {
    isDragging = false;
});

// escutando se o objeto mudou
socket.on("object move", (left, top) => {
    objeto.style.left = left;
    objeto.style.top = top;
    console.log('estou recebendo informação de objectMoved');
});
