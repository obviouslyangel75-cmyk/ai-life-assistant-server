require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const celebritiesRouter = require('./routes/celebrities');
const feedRouter = require('./routes/feed');
const commentsRouter = require('./routes/comments');
const reactionsRouter = require('./routes/reactions');
const subscriptionsRouter = require('./routes/subscriptions');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRouter);
app.use('/api/celebrities', celebritiesRouter);
app.use('/api/feed', feedRouter);
app.use('/api', commentsRouter);
app.use('/api', reactionsRouter);
app.use('/api', subscriptionsRouter);
app.use('/api/admin', adminRouter);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Fallback to the SPA shell for any other non-API GET request.
app.get(/^\/(?!api|uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

app.listen(PORT, () => {
  console.log(`CelebConnect running at http://localhost:${PORT}`);
});
