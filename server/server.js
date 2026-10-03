require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { initSocket } = require('./sockets');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const fileRoutes = require('./routes/fileRoutes');
const callRoutes = require('./routes/callRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const teamRoutes = require('./routes/teamRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const allowedOrigins = Array.from(
  new Set([
    CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost',
    'http://127.0.0.1',
  ].filter(Boolean))
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
  maxHttpBufferSize: 1e7,
});

// --- Security & core middleware ---
app.use(helmet({ crossOriginResourcePolicy: false })); // allow serving /uploads cross-origin to the client
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Static file serving for uploaded attachments
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teams', teamRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'WorkWave API is running.' }));

app.use(notFound);
app.use(errorHandler);

// --- Socket.IO ---
initSocket(io);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  if (process.env.AUTO_SEED === 'true') {
    try {
      const User = require('./models/User');
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[server] Database is empty. Auto-seeding initial demo data...');
        const { seed } = require('./seed/seed');
        await seed({ disconnectOnEnd: false });
        console.log('[server] Auto-seeding complete.');
      }
    } catch (seedErr) {
      console.warn('[server] Auto-seed check notice:', seedErr.message);
    }
  }

  server.listen(PORT, () => {
    console.log(`[server] WorkWave API listening on http://localhost:${PORT}`);
    console.log(`[server] Accepting client connections from ${CLIENT_URL}`);
  });
}

start();

module.exports = { app, server, io };
