const socket = io();

let notificationsMuted = false;

// Request Notification permission
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

const notificationSound = new Audio('notification.mp3');

document.getElementById('login-button').addEventListener('click', () => {
    const passwordInput = document.getElementById('password-input').value;
    const username = prompt("Enter your username");
    socket.emit('login', { username, password: passwordInput });
});

document.getElementById('send-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const messageInput = document.getElementById('message-input').value;
    socket.emit('chat message', { username, message: messageInput });
    document.getElementById('message-input').value = '';
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

document.getElementById('mute-button').addEventListener('click', () => {
    notificationsMuted = !notificationsMuted;
    const muteButton = document.getElementById('mute-button');
    if (notificationsMuted) {
        muteButton.innerHTML = '<i class="fas fa-bell"></i> Unmute Notifications';
    } else {
        muteButton.innerHTML = '<i class="fas fa-bell-slash"></i> Mute Notifications';
    }
});

socket.on('login success', (username) => {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('chat-container').style.display = 'block';
    document.getElementById('username').value = username;
});

socket.on('login failure', () => {
    alert('Incorrect password');
});

socket.on('load messages', (messages) => {
    const messageContainer = document.getElementById('messages');
    messageContainer.innerHTML = '';
    messages.forEach((data) => {
        const messageElement = document.createElement('div');
        messageElement.id = `message-${data.id}`;
        messageElement.innerHTML = `
            <img src="pfp.png" alt="avatar" class="avatar">
            <strong>${data.username}</strong>: ${data.message}
            <span class="message-timestamp">${data.timestamp}</span>
        `;
        messageContainer.appendChild(messageElement);
    });
});

socket.on('chat message', (data) => {
    const messages = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.id = `message-${data.id}`;
    messageElement.innerHTML = `
        <img src="pfp.png" alt="avatar" class="avatar">
        <strong>${data.username}</strong>: ${data.message}
        <span class="message-timestamp">${data.timestamp}</span>
    `;
    messages.appendChild(messageElement);

    if (!notificationsMuted && Notification.permission === "granted") {
        new Notification(`${data.username}`, {
            body: data.message,
            icon: 'pfp.png'
        });
    }

    if (!notificationsMuted) {
        notificationSound.play();
    }
});

socket.on('delete message', (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
        messageElement.remove();
    }
});

socket.on('file upload', (data) => {
    const messages = document.getElementById('messages');
    const fileElement = document.createElement('div
