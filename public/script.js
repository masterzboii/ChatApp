const socket = io();

// Request Notification permission
if (Notification.permission !== "granted") {
    Notification.requestPermission();
}

const notificationSound = new Audio('notification.mp3');

document.getElementById('login-button').addEventListener('click', () => {
    const passwordInput = document.getElementById('password-input').value;
    if (passwordInput === "UqVhF6pP{[o,EP2Me2[4SZ{+a=meu!^[;iKaDH=~~TPtsvOiW(") {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('chat-container').style.display = 'block';
        const username = prompt("Enter your username");
        document.getElementById('username').value = username;
        socket.emit('new user', { username, password: passwordInput });
    } else {
        alert('Incorrect password');
    }
});

document.getElementById('send-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const messageInput = quill.root.innerHTML;
    const avatarInput = document.getElementById('avatar-input');
    const avatar = avatarInput.files[0] ? URL.createObjectURL(avatarInput.files[0]) : null;
    socket.emit('chat message', { username, message: messageInput, avatar });
    quill.root.innerHTML = '';
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

const quill = new Quill('#message-input', {
    theme: 'snow'
});

const picker = new EmojiMart.Picker({
    onSelect: emoji => {
        quill.insertText(quill.getSelection().index, emoji.native);
    }
});

document.getElementById('emoji-button').addEventListener('click', () => {
    document.getElementById('emoji-container').appendChild(picker);
});

socket.on('load messages', (messages) => {
    const messageContainer = document.getElementById('messages');
    messageContainer.innerHTML = '';
    messages.forEach((data) => {
        const messageElement = document.createElement('div');
        messageElement.id = `message-${data.id}`;
        messageElement.innerHTML = `
            <img src="${data.avatar || 'default-avatar.png'}" alt="avatar" class="avatar">
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
        <img src="${data.avatar || 'default-avatar.png'}" alt="avatar" class="avatar">
        <strong>${data.username}</strong>: ${data.message}
        <span class="message-timestamp">${data.timestamp}</span>
    `;
    messages.appendChild(messageElement);

    if (Notification.permission === "granted") {
        new Notification(`${data.username}`, {
            body: data.message,
            icon: data.avatar || 'default-avatar.png'
        });
    }

    notificationSound.play();
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
    fileElement.innerHTML = `
        <img src="${data.avatar || 'default-avatar.png'}" alt="avatar" class="avatar">
        <strong>${data.username}</strong> uploaded a file:
        <a href="${data.fileContent}" download="${data.fileName}">${data.fileName}</a>
    `;
    messages.appendChild(fileElement);
});

socket.on('user list', (users) => {
    const onlineUsers = document.getElementById('online-users');
    onlineUsers.innerHTML = `<strong>Online Users:</strong> ${users.join(', ')}`;
});
