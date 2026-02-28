const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Use JSON file for storage
const adapter = new FileSync('./db.json');
const db = low(adapter);

// Set default data if db.json is empty
db.defaults({
  mainRallies: [],
  counterRallies: [],
  ghostRallies: [],
  counterCounterRallies: [],
  secondGhostRallies: [],
  settings: {
    counterOffset: 0,
    ghostOffset: 0,
    counterCounterOffset: 0,
    secondGhostOffset: 0
  },
  timerState: {
    startTime: null,
    status: 'idle'
  },
  wikiContent: {
    title: "Rally Coordination",
    content: "The Rally Command tool helps you synchronize multiple attacks to hit a target simultaneously."
  }
}).write();

// Reset timer state on startup to prevent stale timers
db.set('timerState', { startTime: null, status: 'idle' }).write();

app.get('/api/rallies', (req, res) => {
  res.json(db.getState());
});

app.post('/api/rallies', (req, res) => {
  const { timerState, ...configs } = req.body;
  db.setState({ ...db.getState(), ...configs }).write();
  io.emit('update', db.getState());
  res.status(200).send({ message: 'Rallies updated successfully' });
});

// Wiki API
app.get('/api/wiki', (req, res) => {
  res.json(db.get('wikiContent').value());
});

app.post('/api/wiki', (req, res) => {
  const { code, content } = req.body;
  if (code !== '262-12345') {
    return res.status(403).send({ message: 'Unauthorized' });
  }
  db.set('wikiContent', content).write();
  res.status(200).send({ message: 'Wiki updated successfully' });
});

// The "catchall" handler
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});


io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('update', db.getState());
  if (db.get('timerState.status').value() === 'counting' && db.get('timerState.startTime').value()) {
    socket.emit('start-timer', db.get('timerState.startTime').value());
  }

  socket.on('start-timer', (startTime) => {
    db.set('timerState.startTime', startTime).write();
    db.set('timerState.status', 'counting').write();
    io.emit('start-timer', startTime);
    console.log('Timer started at:', startTime);
  });

  socket.on('cancel-timer', () => {
    db.set('timerState.startTime', null).write();
    db.set('timerState.status', 'idle').write();
    io.emit('cancel-timer');
    console.log('Timer cancelled');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
