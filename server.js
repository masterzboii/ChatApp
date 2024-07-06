const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const messages = [];
const users = new Set();

const PASSWORD = "UqVhF6pP{[o,EP2Me2[4SZ{+a=meu!^[;iKaDH=~~TPtsvOiW(";

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/chatapp' }),
  cookie: { secure: false } // Set to true if using HTTPS
}));

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

const authMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    res.sendFile(__dirname + '/public/password.html');
  }
};

app.get('/', authMiddleware, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.sendFile(__dirname + '/public/password.html');
  }
});

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

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
