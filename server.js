const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const basicAuth = require('basic-auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const auth = (req, res, next) => {
    const user = basicAuth(req);
    if (user && user.name === 'user' && user.pass === 'v-mwQ5MKTLn{af;A&wT;bOc[o&.~_4)7Pq62Uoiza!-fDB@fRt') {
        return next();
    } else {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send();
    }
};

app.use(auth);
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    socket.on('file upload', (data) => {
        io.emit('file upload', data);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
