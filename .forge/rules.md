# Build Rules

## Stack Defaults
- Backend:  FastAPI + sqlite3 (raw SQL, no ORM)
- Frontend: React + Vite + plain JavaScript (not TypeScript)
- Styling:  Tailwind CSS
- Deploy:   Railway (single service, free tier)

## Constraints
- Free tiers only — no paid services or credit card required
- Single deployable unit — no microservices
- SQLite for all persistence — no Postgres, Redis, or external DBs
- Environment variables for all secrets — never hardcode

## What NOT to use
- ORMs (SQLAlchemy, Prisma) — use sqlite3 directly
- TypeScript — use plain JavaScript/JSX
- Redux, Zustand, React Query — use useState/useEffect + fetch()
- Celery or message queues
- GraphQL — use REST
- Complex auth (OAuth2, social login) — use simple JWT if needed

## Use when appropriate
- Redis — for caching high-read data or improving page load
- Docker + docker-compose — when stack has multiple services (e.g. app + Redis)

## Code Style
- Clear over clever
- Small files, small functions
- Basic error handling at boundaries
- No premature abstraction
