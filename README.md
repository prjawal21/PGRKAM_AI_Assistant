# PGRKAM AI Assistant

**Un-Official AI-powered employment assistant for the Punjab Government's PGRKAM (Punjab Ghar Ghar Rozgar and Karobar Mission) portal.**

A full-stack multilingual chatbot application providing job search assistance, career guidance, and skill development information for job seekers in Punjab, India.

## 🌟 Features

### Multilingual Support
- **3 Languages**: English, Hindi (Devanagari), Punjabi (Gurmukhi)
- **Auto Language Detection**: Automatically detects user's speaking/typing language
- **Pure Script Output**: No language mixing in responses
- **Speech-to-Text**: Voice input support for all languages
- **Text-to-Speech**: Premium AI voice output using ElevenLabs API for all languages

### AI-Powered Assistance
- **Groq Llama-3.3-70b**: Advanced LLM for intelligent responses
- **Punjab-Focused Content**: Strictly PGRKAM/Punjab employment information only
- **Personalized Recommendations**: Based on user skills, education, and interests
- **Career Guidance**: Job search, interview prep, skill development advice

### User Features
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **User Profiles**: Manage personal info, skills, education, career summary
- **Chat History**: Persistent conversation storage with MongoDB
- **Session Management**: Multiple chat sessions per user
- **Profile Customization**: Update skills, education, location preferences

### Technical Highlights
- **Modern Stack**: React + FastAPI + MongoDB
- **Responsive UI**: Beautiful gradient design with glassmorphism effects
- **Real-time Chat**: Instant AI responses with markdown formatting
- **Watermark Branding**: Official PGRKAM logo on all pages
- **Compact Formatting**: Clean, professional markdown rendering

---

## 📁 Project Structure

```
pgrkam-llm-monorepo/
├── backend/              # FastAPI backend
│   ├── main.py          # Application entry point
│   ├── auth/            # JWT authentication
│   ├── routes/          # API endpoints (auth, chat, user)
│   ├── models/          # Pydantic schemas
│   ├── db/              # MongoDB connection
│   └── utils/           # Groq client, language detection
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/       # Chat, History, Profile, Login
│   │   ├── components/  # Dock, Settings, Modals
│   │   ├── context/     # Auth, Language contexts
│   │   ├── hooks/       # Speech recognition/synthesis
│   │   └── i18n/        # Translations
│   └── public/          # Logo, assets
└── .env.example         # Environment template'
└── project_documents/      # PPTs, Literature review, project reports
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MongoDB** (local or Atlas)
- **Groq API Key** ([Get one here](https://console.groq.com))
- **ElevenLabs API Key** ([Get one here](https://elevenlabs.io)) - For text-to-speech

### Backend Setup

1. **Navigate to backend:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
# Copy .env.example to .env in root directory
cp ../.env.example ../.env
```

5. **Update `.env` with your credentials:**
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=pgrkam
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
GROQ_API_KEY=gsk_your_groq_api_key_here
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key_here
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

6. **Start backend:**
```bash
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (returns JWT)
- `POST /api/auth/change-password` - Change password

### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `DELETE /api/account` - Delete account

### Chat
- `POST /api/chat` - Send message, get AI response
- `POST /api/chat/new-session` - Create new chat session
- `GET /api/chat/sessions` - Get all sessions
- `GET /api/chat/session/{id}` - Get session history
- `DELETE /api/chat/session/{id}` - Delete session

### Text-to-Speech
- `POST /api/tts` - Convert text to speech using ElevenLabs

---

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `pgrkam` |
| `JWT_SECRET` | Secret for JWT tokens (32+ chars) | `your-secret-key` |
| `GROQ_API_KEY` | Groq API key | `gsk_...` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key for TTS | `sk_...` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |

---

## 🎨 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor (async driver)
- **Groq** - LLM API (Llama-3.3-70b-versatile)
- **ElevenLabs** - Premium text-to-speech API
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Framer Motion** - Animations
- **React Markdown** - Markdown rendering

---

## 📖 Usage

1. **Register/Login** at `http://localhost:5173`
2. **Set Language** using the settings modal (English/Hindi/Punjabi)
3. **Start Chatting** - Ask about:
   - Job opportunities in Punjab
   - Skill development programs
   - Training courses
   - Career guidance
4. **Use Voice Input** - Click microphone icon to speak
5. **Listen to Responses** - Click speaker icon (🔉) on AI messages to hear them
6. **View History** - Access past conversations
7. **Update Profile** - Add skills, education, location

---

## 🔒 Security Features

- JWT-based authentication
- Bcrypt password hashing
- Protected API routes
- CORS configuration
- Environment variable protection
- Secure session management

---

## 🌍 Multilingual Implementation

### Language Detection
- Automatic detection from user input (Devanagari/Gurmukhi/Latin scripts)
- Frontend language selector
- Persistent language preference

### Translation System
- `frontend/src/i18n/translations.js` - All UI translations
- `backend/utils/groq_client.py` - Language-specific system prompts
- Pure script enforcement (no Hinglish/mixing)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Punjab Government** - PGRKAM Initiative
- **Groq** - LLM API provider
- **MongoDB** - Database solution
- **React & FastAPI** - Framework communities

---

**Built with ❤️ for Punjab's job seekers**
