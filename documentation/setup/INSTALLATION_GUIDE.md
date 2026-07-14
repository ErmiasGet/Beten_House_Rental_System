# Installation Guide

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: 14 or higher
- **Docker**: (optional, for containerized database)
- **Git**: for version control

## Quick Start

### 1. Clone the Repository

```bash
   git clone https://github.com/your-org/beten-homes-rent.git
   cd beten-homes-rent
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# This will install dependencies for:
# - shared/
# - desktop-app/backend/
# - desktop-app/frontend/
# - mobile-app/
```

### 3. Environment Configuration

```bash
# Copy environment file
cp desktop-app/backend/.env.example desktop-app/backend/.env

# Edit the .env file with your settings:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Your secret key for JWT tokens
# - JWT_REFRESH_SECRET: Your secret key for refresh tokens
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose -f deployment/docker/docker-compose.dev.yml up -d
```

#### Option B: Using Local PostgreSQL

```bash
# Create the database
createdb betenhomesrent_db

# Set up environment variables
export DATABASE_URL="postgresql://username:password@localhost:5432/betenhomesrent_db"
```

### 5. Run Migrations & Seed

```bash
# Generate Prisma client
cd desktop-app/backend
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npx ts-node src/prisma/seed.ts

# Go back to root
cd ../..
```

### 6. Start Development Servers

```bash
# From root directory
npm run dev

# Or start individually:
npm run dev:backend   # Backend API on http://localhost:5000
npm run dev:frontend  # Frontend app on http://localhost:5173
```

### 7. Access the Application

- **Desktop App**: http://localhost:5173
- **API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

### 8. Demo Credentials

- **Email**: admin@betora.com
- **Password**: admin123

## Mobile App Setup

### Prerequisites

- Node.js v18.0.0+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS/Android)

### Installation

```bash
# Navigate to mobile app
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Run on Device

1. Install **Expo Go** from App Store or Google Play
2. Scan the QR code from the terminal or Expo DevTools
3. The app will load on your device

### Configure API URL

Edit `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://your-server-ip:5000/api/v1';
```

## Production Build

### Backend

```bash
cd desktop-app/backend
npm run build
NODE_ENV=production node dist/server.js
```

### Frontend

```bash
cd desktop-app/frontend
npm run build
# Output in dist/ folder
```

### Docker Production

```bash
# From root directory
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify credentials

2. **Prisma client not found**
   - Run `npx prisma generate` in backend directory

3. **Port already in use**
   - Change PORT in .env file
   - Kill existing process: `lsof -ti:5000 | xargs kill -9`

4. **Mobile app can't connect to API**
   - Update API_BASE_URL to your machine's IP
   - Ensure firewall allows connection
   - Use 10.0.2.2 for Android emulator
