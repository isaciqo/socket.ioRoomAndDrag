// client.js
// Inicializa o cliente Socket.IO enviando para o localhost e habilitando a comunicação
var socket = io('http://localhost:3000/', { transports : ['websocket'] });
const roomNameInput = document.getElementById('roomName');
const joinCreateRoomButton = document.getElementById('joinCreateRoom');
const criarQuadradoBtn = document.getElementById('criarQuadrado');
const quadradoContainer = document.getElementById('quadradoContainer');
const userIdInput = document.getElementById('userId');
const userRoleInput = document.getElementById('userRole');
const fileInput = document.getElementById("fileInput"); 
let contadorQuadrados = 0;
let isDragging = false;
let isResizing = false;
let activeElement, offsetX, offsetY, initialWidth, initialHeight;
const areaRestrita = document.getElementById("area-restrita");
fileInput.disabled = true;
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
        if(userRoleInput.value.trim() == 'mestre'){
            fileInput.disabled = false;
        }
        
        userIdInput.disabled = true; // Desativa o campo de entrada de ID após entrar na sala
    }
});

// Define um ouvinte de evento para receber o estado incial de uma sala, caso alguem já tenha entrado antes
socket.on('initial state', (initialMessages, initialObjects, initialImagens) => {
    // Exibe as imagens iniciais
    initialImagens.forEach((imagem) => {
        areaRestrita.style.backgroundImage = `url('${imagem}')`;
    });

    // Exibe as mensagens iniciais
    initialMessages.forEach((message) => {
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messages.appendChild(messageElement);
    });
    // Cria os objetos iniciais
    console.log(initialObjects)
    initialObjects.forEach(( object ) => {
        contadorQuadrados = object.elementID;
        const novoQuadrado = document.createElement('div');
        novoQuadrado.classList.add('quadrado');
        novoQuadrado.id = contadorQuadrados;
        novoQuadrado.style.left = object.position.x;
        novoQuadrado.style.top = object.position.y;
        novoQuadrado.style.backgroundImage = `url('${object.imagem}')`;
        //cria o botão de upload a caixa
        uploadImagem(novoQuadrado);
        criarBotaoExcluir(novoQuadrado);  // Adiciona o botão "X" para excluir
        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');
        novoQuadrado.appendChild(resizeHandle);
        novoQuadrado.style.width = object.size.width ;
        novoQuadrado.style.height = object.size.height ;
        novoQuadrado.addEventListener('click', () => {
            console.log('ID do quadrado clicado: ' + novoQuadrado.id);
        });

        quadradoContainer.appendChild(novoQuadrado);
        tornarArrastavelERedimensionavel(novoQuadrado);
    });
});

const messages = document.getElementById('messages');
const messageInput = document.getElementById('message');
const sendButton = document.getElementById('send');

// Define um ouvinte de evento para o botão "Enviar mensagem"
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

// Define um ouvinte de evento para receber mensagens do servidor e exibi-las
socket.on('chat message', (message) => {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messages.appendChild(messageElement);
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

// Define um ouvinte de evento para criar caixas
socket.on('Create box', (quadradoID) => {
    const novoQuadrado = document.createElement('div');
    novoQuadrado.classList.add('quadrado');
    contadorQuadrados = quadradoID
    novoQuadrado.id = contadorQuadrados;

    //cria o botão de upload a caixa
    uploadImagem(novoQuadrado);

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

// escutando se o objeto mudou
socket.on("any object move", (left, top, elementID) => {
    const elementoMovido = document.getElementById(elementID);
    elementoMovido.style.left = left;
    elementoMovido.style.top = top;
});

// escutando se o objeto mudou de tamanho
socket.on("any object Resizing", (width, height, elementID) => {

    const elemento = document.getElementById(elementID);
    const newWidth =  width - elemento.getBoundingClientRect().left
    const newHeight =  height - elemento.getBoundingClientRect().top
    elemento.style.width = newWidth + 'px';
    elemento.style.height = newHeight + 'px';
});

// escutando se o objeto foi excluido
socket.on('delete object', (elementID) => {
    const elementoDeletado = document.getElementById(elementID);
    if (elementoDeletado) {
        elementoDeletado.remove();
    }
});



// emite o evento de mudança de imagem do mapa
document.addEventListener("DOMContentLoaded", function() {
       
  
    fileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
  
        reader.onload = function(event) {
            // Emitir evento para o servidor informando a mudança da imagem de fundo
            socket.emit('changeBackground', roomNameInput.value, event.target.result);
        };
  
        reader.readAsDataURL(file);
    });
});

// Escutar o evento de mudança de imagem de jogador
socket.on('updateObjectImage', (quadradoID, imageData) => {

    const objetoAtualizado = document.getElementById(quadradoID);
    
    if (objetoAtualizado) {
        // Atualiza a imagem do objeto com a imagem carregada
        // Aqui você pode usar o imageData para definir a imagem como plano de fundo do objeto, por exemplo
        objetoAtualizado.style.backgroundImage = `url('${imageData}')`;
    }
});

// Escutar o evento de mudança de imagem de fundo
socket.on('backgroundChanged', (newBackground) => {
    
    areaRestrita.style.backgroundImage = `url('${newBackground}')`;
    // Você pode adicionar outras lógicas aqui, se necessário
});

// funções usadas quando um objeto é criado
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

function uploadImagem(objeto) {
    // Cria o botão de upload de imagem
    const uploadImageButton = document.createElement('input');
    uploadImageButton.type = 'file';
    uploadImageButton.accept = 'image/*'; // Aceita apenas arquivos de imagem

    // Adiciona um evento de mudança ao botão de upload de imagem
    uploadImageButton.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function (event) {
            // Emite um evento para o servidor com a imagem carregada
            socket.emit('uploadImage', roomNameInput.value, contadorQuadrados, event.target.result);
        };
        reader.readAsDataURL(file);
    });

    // Cria um ícone ou texto para ativar o botão de upload de imagem
    const uploadIcon = document.createElement('div');
    uploadIcon.innerText = 'U';
    uploadIcon.classList.add('upload-icon'); // Estilize o ícone conforme necessário

    // Adiciona um evento de clique ao ícone/texto para acionar o botão de upload de imagem
    uploadIcon.addEventListener('click', () => {
        uploadImageButton.click(); // Clique no botão de upload de imagem
    });

    // Adiciona o botão de upload de imagem e o ícone ao quadrado
    objeto.appendChild(uploadIcon);
}

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
            initialWidth = activeElement.offsetWidth;
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
            const newWidth =  initialWidth + e.clientX - (offsetX);
            const newHeight = initialHeight + e.clientY - offsetY;

            
            activeElement.style.width = newWidth + 'px';
            activeElement.style.height = newHeight + 'px';
            socket.emit('any object Resizing', roomNameInput.value, {
                width: newWidth,
                height: newHeight,
                elementID: activeElement.id,
            }, socket.id);
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            socket.emit('save estate size and place', roomNameInput.value, {
                left: activeElement.style.left,
                top: activeElement.style.top,
                width: activeElement.style.width,
                height: activeElement.style.height,
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
            //cria o botão de upload a caixa
            uploadImagem(novoQuadrado);
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
