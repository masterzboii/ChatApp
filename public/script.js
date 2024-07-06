const socket = io();

const password = prompt("Enter the password to access the chat");
fetch('/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `password=${encodeURIComponent(password)}`
}).then(response => {
    if (response.ok) {
        document.getElementById('chat-container').style.display = 'block';
        const username = prompt("Enter your username");
        initializeChat(username);
    } else {
        alert('Incorrect password. Please refresh and try again.');
    }
});

function initializeChat(username) {
    document.getElementById('send-button').addEventListener('click', () => {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value;
        socket.emit('chat message', { username, message });
        messageInput.value = '';
    });

    document.getElementById('upload-button').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });

    document.getElementById('file-input').addEventListener('change', () => {
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

    socket.emit('new user', { username });
}
