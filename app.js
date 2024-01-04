const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;
// Should be in an env file in a prod ready application
const SECRET = 'SECr3t'; 

mongoose.connect('mongodb+srv://saksham:qHtSmAxZj6B3g0a7@cluster0.dt7y968.mongodb.net/?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api/', limiter);

const User = mongoose.model('User', {
  username: String,
  password: String,
});

const Note = mongoose.model('Note', {
  title: String,
  content: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
    jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Forbidden' });
      req.user = user;
      next();
    });
  };

// Authentication Endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const accessToken = jwt.sign({ username }, SECRET, { expiresIn: '1h' });
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Note Endpoints
app.get('/api/notes', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({ owner: req.user.username });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user.username });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = new Note({ title, content, owner: req.user.username });
    await note.save();

    res.json({ message: 'Note created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.username },
      { title, content },
      { new: true }
    );

    if (!updatedNote) return res.status(404).json({ error: 'Note not found' });

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/notes/:id', authenticateToken, async (req, res) => {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user.username });

    if (!deletedNote) return res.status(404).json({ error: 'Note not found' });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/notes/:id/share', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userToShare = await User.findOne({ username });

    if (!userToShare) return res.status(404).json({ error: 'User not found' });

    const note = await Note.findOne({ _id: req.params.id, owner: req.user.username });
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.sharedWith.includes(userToShare._id)) {
      return res.status(400).json({ error: 'Note already shared with this user' });
    }

    note.sharedWith.push(userToShare._id);
    await note.save();

    res.json({ message: 'Note shared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const query = req.query.q;
    const notes = await Note.find({
      $and: [
        { owner: req.user.username },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
          ],
        },
      ],
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
