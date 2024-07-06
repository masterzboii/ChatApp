const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const basicAuth = require('basic-auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const messages = [];
const users = new Set();

const PASSWORD = "UqVhF6pP{[o,EP2Me2[4SZ{+a=meu!^[;iKaDH=~~TPtsvOiW(";

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use('/api/', apiLimiter);

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
    return next();
});

const sanitize = (str) => {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const auth = (req, res, next) => {
    const user = basicAuth(req);
    if (user && user.pass === PASSWORD) {
        return next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send();
    }
};

app.use(auth);

const addMessage = (message) => {
    messages.push(message);
    setTimeout(() => {
        const index = messages.indexOf(message);
        if (index > -1) {
            messages.splice(index, 1);
            io.emit('delete message', message.id);
        }
    }, 5 * 60 * 1000); // 5 minutes
};

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        users.delete(socket.username);
        io.emit('user list', Array.from(users));
        console.log('user disconnected');
    });
    socket.on('new user', (data) => {
        socket.username = data.username;
        users.add(socket.username);
        io.emit('user list', Array.from(users));
        socket.emit('load messages', messages);
    });
    socket.on('chat message', (data) => {
        const message = { ...data, id: Date.now(), timestamp: new Date().toLocaleTimeString() };
        addMessage(message);
        io.emit('chat message', message);
    });
    socket.on('file upload', (data) => {
        io.emit('file upload', data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
