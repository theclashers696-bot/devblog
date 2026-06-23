# DevBlog — Blog Platform

A full-stack portfolio blog platform built with:
- **Frontend**: Next.js 14 (App Router) + TipTap rich text editor + Tailwind CSS
- **Backend**: Golang (Gin framework) + RESTful API
- **Database**: PostgreSQL
- **Auth**: JWT tokens

## Project Structure

```
blog-platform/
├── backend/           # Golang API server (port 8080)
│   ├── handlers/      # HTTP request handlers
│   ├── middleware/    # JWT auth middleware
│   ├── models/        # GORM models (User, Post, Comment)
│   ├── routes/        # Route setup
│   ├── database/      # DB connection + migrations
│   └── main.go
├── frontend/          # Next.js frontend (port 3000)
│   └── src/
│       ├── app/       # Next.js App Router pages
│       ├── components/
│       ├── context/   # Auth context
│       └── lib/       # API client + types
```

## Features
- User registration/login with JWT auth
- Two roles: **Author** (create/edit/delete posts) and **Reader** (comment)
- Rich text editor (TipTap) with formatting, code blocks, images
- Post management dashboard for authors
- Comment system for readers
- Tag filtering and search
- Server-side rendered SEO-friendly pages
- Draft/publish workflow

## Running the project
The app runs as two workflows:
- **Backend**: `cd backend && go run .` on port 8080
- **Frontend**: `cd frontend && npm run dev` on port 3000

## User preferences
- Stack: Next.js + Golang + PostgreSQL + JWT
- Editor: TipTap
