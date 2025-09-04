# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLM Trace is a comprehensive LLM debugging and tracing system that provides:
- **Production tracing**: Track real LLM API calls from your applications
- **Replay debugging**: Re-run specific calls with modified parameters
- **Playground testing**: Create isolated debugging environments for experimentation
- **Multi-turn debugging**: Test multi-round conversations starting from any point

## Architecture

### System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│  Trace Backend  │───▶│   React UI      │
│   (Your Code)   │    │   (Go/Gin)      │    │  (TypeScript)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    Async POST              SQLite DB               Real-time
    /api/trace              GORM ORM                Dashboard
```

### Data Models

#### Production Environment
- **Session**: Conversation sessions with auto-generated names
- **Record**: Individual LLM calls with full request/response data

#### Debug Environment  
- **Playground**: Isolated debugging environments
- **DebugSession**: Multi-turn debugging sessions within playgrounds
- **DebugRecord**: Debug-specific call records

## Quick Start Commands

### Backend (Go)
```bash
# Start backend service
cd backend
./start.sh
# or: go run .

# Build for production
go build -o llmtrace .

# Environment variables
export OPENAI_API_KEY="your-key"
export LLMTRACE_SERVER_PORT=8081
export LLMTRACE_DATABASE_DRIVER=sqlite
export LLMTRACE_DATABASE_DSN="./data/llmtrace.db"
```

### Frontend (React/TypeScript)
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start
# App runs at http://localhost:3000

# Build for production
npm run build
```

### Testing Integration
```bash
# Test backend API
curl -X POST http://localhost:8081/api/trace \
  -H "Content-Type: application/json" \
  -d '{"trace_id": "test_session", "turn_number": 1, "request": {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "hello"}]}, "status": "success"}'
```

## Development Workflow

### 1. Backend Development
- **Entry point**: `backend/main.go:15`
- **Routes**: `backend/handlers/handler.go:25`
- **Models**: `backend/types.go:18`
- **Config**: `backend/config/config.go:10`

### 2. Frontend Development  
- **Entry point**: `frontend/src/App.tsx:13`
- **API calls**: `frontend/src/services/api.ts:14`
- **Types**: `frontend/src/types/index.ts:2`
- **State**: `frontend/src/store/index.ts:15`

## Key API Endpoints

### Core Endpoints
- `POST /api/trace` - Report LLM call data
- `GET /api/sessions` - List sessions  
- `GET /api/sessions/:id/records` - Get session records
- `POST /api/records/:id/replay` - Replay specific call

### Playground Endpoints
- `POST /api/playgrounds` - Create playground
- `GET /api/playgrounds/:id` - Get playground details
- `POST /api/playgrounds/:id/debug` - Execute debug call
- `GET /api/playgrounds/:id/sessions` - List debug sessions

## Code Structure

### Backend (`/backend`)
```
├── main.go              # Application entry
├── handlers/            # REST API handlers
│   ├── trace.go         # Core tracing logic
│   ├── sessions.go      # Session management  
│   ├── records.go       # Record operations
│   ├── playground.go    # Debug environment
│   └── providers.go     # LLM provider configs
├── models/              # Database models
├── config/              # Configuration management
└── types.go             # Shared data structures
```

### Frontend (`/frontend`)
```
├── src/
│   ├── pages/           # Route components
│   │   ├── Sessions.tsx # Production sessions
│   │   ├── Playgrounds.tsx # Debug environments
│   │   └── RecordDetail.tsx # Call details
│   ├── components/      # Reusable components
│   ├── services/        # API client layer
│   ├── store/           # State management (Zustand)
│   └── types/           # TypeScript definitions
```

## Integration Patterns

### 1. Production Tracing
Add to your LLM calls:
```javascript
// Async tracing (non-blocking)
fetch('http://localhost:8081/api/trace', {
  method: 'POST',
  body: JSON.stringify({
    session_id: 'user_session_123',
    turn_number: 1,
    request: llmRequest,
    response: llmResponse,
    status: 'success'
  })
});
```

### 2. Debug Session Creation
```javascript
// Create playground from production record
const playground = await api.createPlayground({
  name: 'Debug Session',
  description: 'Testing prompt variations'
});

await api.createDebugSession(recordId, playground.id);
```

## Configuration

### Database Support
- **SQLite**: Default, single file
- **MySQL**: Production ready
- **PostgreSQL**: Enterprise ready

### LLM Providers
Configured in `backend/config.yaml`:
- OpenAI (gpt-3.5-turbo, gpt-4)
- DeepSeek (deepseek-chat, deepseek-coder)
- Custom providers via base_url

## Testing Commands

### Backend Tests
```bash
cd backend
# Test database connection
go run . -test-db

# Test API endpoints
go test ./handlers -v
```

### Frontend Tests
```bash
cd frontend
npm test

# Test specific component
npm test -- --testNamePattern="Sessions"
```

## Common Issues

### Port Conflicts
- Backend: Change `LLMTRACE_SERVER_PORT`
- Frontend: Change in `package.json` proxy setting

### Database Issues
- **SQLite**: Ensure `./data/` directory exists
- **MySQL**: Check connection string format
- **PostgreSQL**: Verify SSL settings

### CORS Issues
- Backend handles CORS automatically
- Frontend proxy configured for `localhost:8081`

## Deployment Notes

### Production Build
```bash
# Backend
cd backend
go build -ldflags="-s -w" -o llmtrace .

# Frontend
cd frontend
npm run build
# Serve build/ directory
```

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your_openai_key

# Optional
LLMTRACE_SERVER_HOST=0.0.0.0
LLMTRACE_SERVER_PORT=8081
LLMTRACE_DATABASE_DRIVER=sqlite
LLMTRACE_DATABASE_DSN=./data/llmtrace.db
```