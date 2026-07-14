# Beten Homes Rent System Architecture

## Overview

Beten Homes Rent follows a client-server architecture with three main components:

1. **Desktop Client** - Electron + React SPA
2. **Mobile Client** - React Native + Expo
3. **API Server** - Express.js REST API

## Architecture Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Desktop App    │     │   Mobile App     │     │  External       │
│  (Electron +    │────▶│   (React Native  │────▶│  Services       │
│   React)        │     │    + Expo)       │     │  - Firebase     │
└─────────────────┘     └──────────────────┘     │  - SMTP         │
        │                       │                └─────────────────┘
        │                       │                         │
        ▼                       ▼                         │
┌─────────────────────────────────────────────────┐       │
│            API Gateway (Nginx)                   │       │
└─────────────────────┬───────────────────────────┘       │
                      │                                   │
                      ▼                                   │
┌─────────────────────────────────────────────────┐       │
│          Express.js REST API                     │       │
│  ┌─────────┐ ┌──────────┐ ┌─────────────────┐   │       │
│  │ Auth    │ │ Business │ │ Scheduled Jobs  │   │       │
│  │ Module  │ │ Services │ │ (Cron)          │   │       │
│  └─────────┘ └──────────┘ └─────────────────┘   │       │
└─────────────────────┬───────────────────────────┘       │
                      │                                   │
                      ▼                                   │
┌─────────────────────────────────────────────────┐       │
│          Prisma ORM                              │       │
└─────────────────────┬───────────────────────────┘       │
                      │                                   │
                      ▼                                   │
┌─────────────────────────────────────────────────┐       │
│          PostgreSQL Database                     │       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐ ┌─────┐ │       │
│  │Users │ │House │ │Room  │ │Tenants │ │Pay  │ │       │
│  └──────┘ └──────┘ └──────┘ └────────┘ └─────┘ │       │
└─────────────────────────────────────────────────┘       │
                      │                                   │
                      ▼                                   │
┌─────────────────────────────────────────────────────────┐│
│  Shared Package (Types, Constants, Utils)               ││
└─────────────────────────────────────────────────────────┘│
```

## Data Flow

1. Client sends HTTP request to API Gateway
2. Gateway forwards to Express server
3. Auth middleware validates JWT token
4. Request reaches controller
5. Controller calls service layer
6. Service uses Prisma to query PostgreSQL
7. Response flows back through the chain

## Authentication Flow

```
Client                  Server                  Database
  │                       │                       │
  │──── POST /login ─────▶│                       │
  │                       │─── Find user ────────▶│
  │                       │◀── User data ─────────│
  │                       │                       │
  │                       │─── Verify password ───│
  │                       │─── Generate JWT ──────│
  │◀── Token + User ──────│                       │
  │                       │                       │
  │──── GET /api (JWT) ───▶                       │
  │                       │─── Verify JWT ────────│
  │◀── Response ──────────│                       │
```

## Scheduled Jobs

- **Payment Checker** (runs daily at midnight)
  - Marks unpaid payments as overdue
  - Creates notifications for overdue payments
  - Creates notifications for upcoming payments
  - Alerts for expiring contracts
