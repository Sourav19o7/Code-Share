require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const { detectLanguage } = require('./utils/languageDetector');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// In-memory storage (use Redis/Database in production)
const codeStorage = new Map();

// Cleanup expired codes every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of codeStorage.entries()) {
    if (now > data.expiresAt) {
      codeStorage.delete(id);
      console.log(`Expired code ${id} cleaned up`);
    }
  }
}, 60000);

// Routes
app.post('/api/share', (req, res) => {
  try {
    const { code, filename } = req.body;
    
    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Code content is required' });
    }

    if (code.length > 1024 * 1024) { // 1MB limit
      return res.status(400).json({ error: 'Code content too large (max 1MB)' });
    }

    const id = nanoid(8);
    const language = detectLanguage(code, filename);
    const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes

    const codeData = {
      id,
      code: code.trim(),
      language,
      filename: filename || `code.${getFileExtension(language)}`,
      createdAt: Date.now(),
      expiresAt,
      views: 0
    };

    codeStorage.set(id, codeData);

    console.log(`Code ${id} saved, expires at ${new Date(expiresAt).toISOString()}`);

    res.json({
      id,
      language,
      shareUrl: `${req.protocol}://${req.get('host')}/view/${id}`,
      expiresAt: expiresAt,
      expiresIn: '30 minutes'
    });
  } catch (error) {
    console.error('Error saving code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/code/:id', (req, res) => {
  try {
    const { id } = req.params;
    const codeData = codeStorage.get(id);

    if (!codeData) {
      return res.status(404).json({ error: 'Code not found or expired' });
    }

    if (Date.now() > codeData.expiresAt) {
      codeStorage.delete(id);
      return res.status(404).json({ error: 'Code expired' });
    }

    // Increment view count
    codeData.views++;

    const timeLeft = codeData.expiresAt - Date.now();
    const minutesLeft = Math.ceil(timeLeft / (60 * 1000));

    res.json({
      ...codeData,
      timeLeft: minutesLeft > 0 ? `${minutesLeft} minutes` : 'Less than a minute'
    });
  } catch (error) {
    console.error('Error retrieving code:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', (req, res) => {
  const totalCodes = codeStorage.size;
  const languages = {};
  
  for (const data of codeStorage.values()) {
    languages[data.language] = (languages[data.language] || 0) + 1;
  }

  res.json({
    totalCodes,
    languages,
    uptime: process.uptime()
  });
});

// Serve frontend for view routes
app.get('/view/:id', (req, res) => {
  res.sendFile(__dirname + '/public/view.html');
});

function getFileExtension(language) {
  const extensions = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    cpp: 'cpp',
    c: 'c',
    php: 'php',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    kotlin: 'kt',
    swift: 'swift',
    html: 'html',
    css: 'css',
    json: 'json',
    xml: 'xml',
    yaml: 'yml',
    sql: 'sql',
    bash: 'sh'
  };
  return extensions[language] || 'txt';
}

app.listen(PORT, () => {
  console.log(`🚀 Code Share Server running on port ${PORT}`);
  console.log(`📝 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`⏰ Code expiration: 30 minutes`);
});