const socket = io();

document.getElementById('send-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;
    socket.emit('chat message', { username, message });
    messageInput.value = '';
});

document.getElementById('upload-button').addEventListener('click', () => {
    document.getElementById('file-input').click();
});

document.getElementById('file-input').addEventListener('change', () => {
    const username = document.getElementById('username').value;
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            socket.emit('file upload', { username, fileName: file.name, fileContent });
        };
        reader.readAsDataURL(file);
    }
});

socket.on('load messages', (messages) => {
    const messageContainer = document.getElementById('messages');
    messageContainer.innerHTML = '';
    messages.forEach((data) => {
        const messageElement = document.createElement('div');
        messageElement.id = `message-${data.id}`;
        messageElement.innerHTML = `<strong>${data.username}</strong>: ${data.message} <span class="message-timestamp">${data.timestamp}</span>`;
        messageContainer.appendChild(messageElement);
    });
});

socket.on('chat message', (data) => {
    const messages = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.id = `message-${data.id}`;
    messageElement.innerHTML = `<strong>${data.username}</strong>: ${data.message} <span class="message-timestamp">${data.timestamp}</span>`;
    messages.appendChild(messageElement);
});

socket.on('delete message', (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
        messageElement.remove();
    }
});

socket.on('file upload', (data) => {
    const messages = document.getElementById('messages');
    const fileElement = document.createElement('div');
    fileElement.innerHTML = `<strong>${data.username}</strong> uploaded a file: <a href="${data.fileContent}" download="${data.fileName}">${data.fileName}</a>`;
    messages.appendChild(fileElement);
});

socket.on('user list', (users) => {
    const onlineUsers = document.getElementById('online-users');
    onlineUsers.innerHTML = `<strong>Online Users:</strong> ${users.join(', ')}`;
});

socket.emit('new user', { username: prompt("Enter your username") });
