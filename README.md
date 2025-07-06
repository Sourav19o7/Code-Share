# CodeShare - Modern Code Sharing Platform

A minimalist, dark-themed code sharing platform built with Node.js and vanilla JavaScript. Share code snippets instantly with automatic language detection and 30-minute expiration.

## ✨ Features

- 🚀 **Instant Sharing** - Share code snippets with auto-generated links
- 🔍 **Auto Detection** - Automatically detects programming language for syntax highlighting
- ⏰ **Auto Expiry** - All shared code expires in 30 minutes for privacy
- 🎨 **Modern Design** - Minimalist dark theme with Lexend font
- 📱 **Responsive** - Works beautifully on desktop and mobile
- 🎯 **Drag & Drop** - Drop code files directly onto the interface
- 💾 **Draft Saving** - Automatically saves your work locally
- 📋 **Copy & Download** - Easy copying and downloading of shared code
- 🔗 **Raw View** - Clean raw text view for shared snippets

## 🏗️ Architecture

### Backend
- **Express.js** server with RESTful API
- **In-memory storage** with automatic cleanup
- **Language detection** using highlight.js and custom patterns
- **CORS enabled** for frontend communication
- **Environment configuration** with dotenv

### Frontend
- **Vanilla JavaScript** for optimal performance
- **Modern CSS** with CSS Grid and Flexbox
- **Highlight.js** for syntax highlighting
- **Responsive design** for all devices
- **Accessibility features** and keyboard shortcuts

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd code-share-app
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the backend server**
```bash
npm run dev
# or
npm start
```

5. **Serve the frontend**
```bash
cd ../frontend
# Using Python
python -m http.server 8080
# or using Node.js
npx http-server -p 8080
# or any other static file server
```

6. **Open in browser**
```
http://localhost:8080
```

## 📁 Project Structure

```
code-share-app/
├── backend/
│   ├── server.js              # Main Express server
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── utils/
│       └── languageDetector.js # Language detection logic
├── frontend/
│   ├── index.html             # Main interface
│   ├── view.html              # Code viewing interface
│   ├── style.css              # All styling
│   └── script.js              # Frontend logic
└── README.md
```

## 🛠️ Configuration

### Environment Variables (.env)

```env
PORT=3000                           # Backend server port
NODE_ENV=development               # Environment mode
FRONTEND_URL=http://localhost:8080 # Frontend URL for CORS
```

### Supported Languages

The platform automatically detects these languages:
- JavaScript/TypeScript
- Python
- Java
- C#
- C/C++
- PHP
- Ruby
- Go
- Rust
- Kotlin
- Swift
- HTML/CSS
- JSON/XML
- YAML
- SQL
- Bash/Shell

## 🎯 API Endpoints

### POST `/api/share`
Share a new code snippet
```json
{
  "code": "console.log('Hello, World!');",
  "filename": "hello.js"
}
```

### GET `/api/code/:id`
Retrieve a shared code snippet
```json
{
  "id": "abc123",
  "code": "console.log('Hello, World!');",
  "language": "javascript",
  "filename": "hello.js",
  "timeLeft": "25 minutes",
  "views": 3
}
```

### GET `/api/stats`
Get platform statistics
```json
{
  "totalCodes": 42,
  "languages": {
    "javascript": 15,
    "python": 12,
    "java": 8
  },
  "uptime": 3600
}
```

## 🎨 Theming

The platform uses CSS custom properties for easy theming:

```css
:root {
  --bg-primary: #0d1117;      /* Main background */
  --bg-secondary: #161b22;    /* Card backgrounds */
  --text-primary: #f0f6fc;    /* Primary text */
  --accent-primary: #238636;   /* Primary accent */
  --accent-secondary: #1f6feb; /* Secondary accent */
}
```

## 🔧 Development

### Adding New Languages

1. Update `languagePatterns` in `utils/languageDetector.js`
2. Add file extension mapping in `getFileExtension()`
3. Test detection with sample code

### Customizing Expiration

Change the expiration time in `server.js`:
```javascript
const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
```

### Adding Analytics

Integrate tracking in `frontend/script.js`:
```javascript
function trackEvent(eventName, properties) {
  // Add your analytics service here
  gtag('event', eventName, properties);
}
```

## 🚀 Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
cd backend
pm2 start server.js --name "codeshare"
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY backend/ .
RUN npm install --production
EXPOSE 3000
CMD ["node", "server.js"]
```

### Environment Setup
- Set `NODE_ENV=production`
- Use a proper database (Redis/MongoDB) instead of in-memory storage
- Set up reverse proxy (Nginx) for production
- Enable HTTPS with SSL certificates

## 🔒 Security Considerations

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Consider adding rate limiting for production
- **CORS**: Properly configured for your domain
- **File Size Limits**: 1MB maximum to prevent abuse
- **Auto Cleanup**: Expired content is automatically removed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add feature'`
5. Push to branch: `git push origin feature-name`
6. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Highlight.js](https://highlightjs.org/) for syntax highlighting
- [Lexend](https://www.lexend.com/) for the beautiful typography
- [Express.js](https://expressjs.com/) for the robust backend framework

---

**Built with ❤️ for developers by developers**