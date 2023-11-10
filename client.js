// client.js
// Inicializa o cliente Socket.IO
const socket = io();
const roomNameInput = document.getElementById('roomName');
const joinCreateRoomButton = document.getElementById('joinCreateRoom');
const criarQuadradoBtn = document.getElementById('criarQuadrado');
const quadradoContainer = document.getElementById('quadradoContainer');
let contadorQuadrados = 0;
let isDragging = false;
let isResizing = false;
let activeElement, offsetX, offsetY, initialWidth, initialHeight;

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



criarQuadradoBtn.addEventListener('click', () => {
    const color = 'azul';
    socket.emit('Create box', roomNameInput.value, color);
    console.log('botão de criar');
});


// Define um ouvinte de evento para receber mensagens do servidor e exibi-las
socket.on('chat message', (message) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
});

socket.on('Create box', (color) => {
    const novoQuadrado = document.createElement('div');
    novoQuadrado.classList.add('quadrado');
    novoQuadrado.id = `quadrado${contadorQuadrados}`;
    contadorQuadrados++;
    console.log(color);
    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('resize-handle');

    novoQuadrado.appendChild(resizeHandle);

    novoQuadrado.addEventListener('click', () => {
        console.log('ID do quadrado clicado: ' + novoQuadrado.id);
    });

    quadradoContainer.appendChild(novoQuadrado);

    tornarArrastavelERedimensionavel(novoQuadrado);
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




// Define um ouvinte de evento para criar uma box



function tornarArrastavelERedimensionavel(elemento) {
    elemento.addEventListener('mousedown', (e) => {
        const boundingBox = elemento.getBoundingClientRect();
        const resizeHandleSize = 10;

        if (
            e.target === elemento && e.clientX >= boundingBox.right - resizeHandleSize &&
            e.clientY >= boundingBox.bottom - resizeHandleSize
        ) {
            isResizing = true;
            activeElement = elemento;
            initialWidth = boundingBox.width;
            initialHeight = boundingBox.height;
        } else if (e.target === elemento) {
            isDragging = true;
            activeElement = elemento;
            offsetX = e.clientX - boundingBox.left;
            offsetY = e.clientY - boundingBox.top;
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            activeElement.style.left = e.clientX - offsetX + 'px';
            activeElement.style.top = e.clientY - offsetY + 'px';
            socket.emit('any object move', roomNameInput.value, {
                left: activeElement.style.left,
                top:activeElement.style.top,
                activeElement
            });
            console.log('local enviado')
            console.log('envio de informações', activeElement.style.left, activeElement.style.top, activeElement);
        } else if (isResizing) {
            const newWidth = initialWidth + (e.clientX - activeElement.getBoundingClientRect().left) - (activeElement.getBoundingClientRect().left);
            const newHeight = initialHeight + (e.clientY - activeElement.getBoundingClientRect().top) - (activeElement.getBoundingClientRect().top);
            activeElement.style.width = newWidth + 'px';
            activeElement.style.height = newHeight + 'px';
            
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        activeElement = null;
    });

    document.addEventListener('mouseleave', () => {
        isDragging = false;
        isResizing = false;
        activeElement = null;
    });

    // escutando se o objeto mudou
    socket.on("any object move", (left, top, activeElement) => {
        console.log("any object move", left, top, activeElement);
        activeElement.style.left = left;
        activeElement.style.top = top;
    });
}
