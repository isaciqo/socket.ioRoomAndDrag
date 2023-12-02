// client.js
// Inicializa o cliente Socket.IO
const socket = io();
const roomNameInput = document.getElementById('roomName');
const joinCreateRoomButton = document.getElementById('joinCreateRoom');
const criarQuadradoBtn = document.getElementById('criarQuadrado');
const quadradoContainer = document.getElementById('quadradoContainer');
const userIdInput = document.getElementById('userId');
const userRoleInput = document.getElementById('userRole');
let contadorQuadrados = 0;
let isDragging = false;
let isResizing = false;
let activeElement, offsetX, offsetY, initialWidth, initialHeight;


let idsPlayerIcon = [];
// Define um ouvinte de evento para o botão "Entrar na Sala ou Criar"
joinCreateRoomButton.addEventListener('click', () => {
    // Obtém o nome da sala inserido pelo usuário
    const roomName = roomNameInput.value.trim();
    const userId = userIdInput.value.trim();
    if (roomName && userId) {
        // Emite o evento "join" com o nome da sala
        socket.emit('join', roomName, userId);
        // Desativa o campo de entrada e o botão após entrar na sala
        roomNameInput.disabled = true;
        joinCreateRoomButton.disabled = true;
        userIdInput.disabled = true; // Desativa o campo de entrada de ID após entrar na sala
    }
});

const messages = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

// Define um ouvinte de evento para o botão "Enviar"
sendButton.addEventListener('click', () => {
    // Obtém a mensagem digitada pelo usuário
    const message = messageInput.value;
    const userId = userIdInput.value.trim(); // Obtém o ID do usuário
    const formattedMessage = `${userId}: ${message}`; // Formata a mensagem com o ID do usuário
    if (message) {
        // Emite o evento "chat message" com o nome da sala e a mensagem
        socket.emit('chat message', roomNameInput.value, formattedMessage);
        messageInput.value = ''; // Limpa o campo de mensagem
    }
});



// emite o evento de criar uma caixa
criarQuadradoBtn.addEventListener('click', () => {
    contadorQuadrados++;
    socket.emit('Create box', roomNameInput.value, contadorQuadrados);
    const userRole = userRoleInput.value.trim();

    if (userRole == 'jogador'){
        idsPlayerIcon.push(contadorQuadrados);
    }
});


// Define um ouvinte de evento para receber mensagens do servidor e exibi-las
socket.on('chat message', (message) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
});

// Define um ouvinte de evento para receber mensagens do servidor e exibir o console.log
socket.on('console.log', (initialMessages, initialObjects) => {
    // Exibe as mensagens iniciais
    initialMessages.forEach((message) => {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messages.appendChild(messageElement);
    });
    // Cria os objetos iniciais
    initialObjects.forEach(( object ) => {
        contadorQuadrados = object.elementID;
        const novoQuadrado = document.createElement('div');
        novoQuadrado.classList.add('quadrado');
        novoQuadrado.id = contadorQuadrados;
        novoQuadrado.style.left = object.position.x;
        novoQuadrado.style.top = object.position.y;
        criarBotaoExcluir(novoQuadrado);  // Adiciona o botão "X" para excluir
        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');
        novoQuadrado.appendChild(resizeHandle);

        novoQuadrado.addEventListener('click', () => {
            console.log('ID do quadrado clicado: ' + novoQuadrado.id);
        });

        quadradoContainer.appendChild(novoQuadrado);
        tornarArrastavelERedimensionavel(novoQuadrado);
    });
});

// escutando se o objeto mudou
socket.on("any object move", (left, top, elementID) => {
    const elementoMovido = document.getElementById(elementID);
    elementoMovido.style.left = left;
    elementoMovido.style.top = top;
});

// Adicione um ouvinte de evento para receber o comando de exclusão
socket.on('delete object', (elementID) => {
    const elementoDeletado = document.getElementById(elementID);
    if (elementoDeletado) {
        elementoDeletado.remove();
    }
});

// Define um ouvinte de evento para criar caixas
socket.on('Create box', (quadradoID) => {
    const novoQuadrado = document.createElement('div');
    novoQuadrado.classList.add('quadrado');
    contadorQuadrados = quadradoID
    novoQuadrado.id = contadorQuadrados;

    //cria o botão de excluir a caixa
    criarBotaoExcluir(novoQuadrado);

    

    //parte de reesstruturar o tamanho
    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('resize-handle');
    novoQuadrado.appendChild(resizeHandle);


    //log para confirmar qual quadrado foi clicado
    novoQuadrado.addEventListener('click', () => {
        console.log('ID do quadrado clicado: ' + novoQuadrado.id);
    });

    quadradoContainer.appendChild(novoQuadrado);

    tornarArrastavelERedimensionavel(novoQuadrado);
    activeElement = null;
});


function criarBotaoExcluir(objeto) {
    const botaoExcluir = document.createElement('button');
    botaoExcluir.innerText = 'X';
    botaoExcluir.classList.add('botao-excluir');

    botaoExcluir.addEventListener('click', () => {
        // Emite o evento "delete object" para o servidor
        socket.emit('delete object', roomNameInput.value, objeto.id);
    });

    objeto.appendChild(botaoExcluir);
}


// código de any objeto

function tornarArrastavelERedimensionavel(elemento) {
    let isDragging = false;
    let isResizing = false;
    let activeElement, offsetX, offsetY, initialWidth, initialHeight;

    elemento.addEventListener('mousedown', (e) => {
        const boundingBox = elemento.getBoundingClientRect();
        const resizeHandleSize = 10;
        const userRole = userRoleInput.value.trim();

        if (
            e.target === elemento && e.clientX >= boundingBox.right - resizeHandleSize &&
            e.clientY >= boundingBox.bottom - resizeHandleSize
        ) {
            isResizing = true;
            activeElement = elemento;
            initialWidth = boundingBox.width;
            initialHeight = boundingBox.height;
        } else if (e.target === elemento && (idsPlayerIcon.includes(parseInt(elemento.id)) || userRole == "mestre")) {
            isDragging = true;
            activeElement = elemento;
            offsetX = e.clientX - boundingBox.left;
            offsetY = e.clientY - boundingBox.top;
        }
    });

    document.addEventListener('mousemove', (e) => {
        const userRole = userRoleInput.value.trim();
        if (isDragging && ( idsPlayerIcon.includes(parseInt(activeElement.id)) || userRole == "mestre" )) {
            const containerRect = document.getElementById('container').getBoundingClientRect();
            const maxX = containerRect.width - activeElement.offsetWidth;
            const maxY = containerRect.height - activeElement.offsetHeight;

            let x = e.clientX - offsetX - containerRect.left;
            let y = e.clientY - offsetY - containerRect.top;

            // Limitando o movimento dentro do contêiner
            x = Math.min(Math.max(x, 0), maxX);
            y = Math.min(Math.max(y, 0), maxY);

            activeElement.style.left = x + 'px';
            activeElement.style.top = y + 'px';

            socket.emit('any object move', roomNameInput.value, {
                left: activeElement.style.left,
                top:activeElement.style.top,
                elementID: activeElement.id,
            }, socket.id);
        } else if (isResizing) {
            const newWidth = initialWidth + (e.clientX - activeElement.getBoundingClientRect().left) - (activeElement.getBoundingClientRect().left);
            const newHeight = initialHeight + (e.clientY - activeElement.getBoundingClientRect().top) - (activeElement.getBoundingClientRect().top);
            activeElement.style.width = newWidth + 'px';
            activeElement.style.height = newHeight + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            socket.emit('save estate', roomNameInput.value, {
                left: activeElement.style.left,
                top: activeElement.style.top,
                elementID: activeElement.id,
            });
        }
        isDragging = false;
        isResizing = false;
        activeElement = null;
    });

    document.addEventListener('mouseleave', () => {
        isDragging = false;
        isResizing = false;
        activeElement = null;
    });



    // código para atualizar tudo
    socket.on('initial state', (initialMessages, initialObjects) => {
        // Exibe as mensagens iniciais

        initialMessages.forEach((message) => {
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            messages.appendChild(messageElement);
        });
    
        // Cria os objetos iniciais
        initialObjects.forEach(({ color, elementID }) => {
            const novoQuadrado = document.createElement('div');
            novoQuadrado.classList.add('quadrado');
            novoQuadrado.id = elementID;
            novoQuadrado.style.left = left;
            novoQuadrado.style.top = top;

            criarBotaoExcluir(novoQuadrado);  // Adiciona o botão "X" para excluir
    
            const resizeHandle = document.createElement('div');
            resizeHandle.classList.add('resize-handle');
            novoQuadrado.appendChild(resizeHandle);
    
            novoQuadrado.addEventListener('click', () => {
                console.log('ID do quadrado clicado: ' + novoQuadrado.id);
            });
    
            quadradoContainer.appendChild(novoQuadrado);
    
            tornarArrastavelERedimensionavel(novoQuadrado);
        });
    });
}
