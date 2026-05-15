# PM OS

PM OS is a cohort-focused project management app with a Linear-inspired workflow, GitHub-connected repo tracking, voting, and a dedicated profile experience.

## Local development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Vercel:

```bash
vercel
```

The repo is configured so Vercel builds the `frontend/` Vite app from the project root using [`vercel.json`](./vercel.json).

## GitHub OAuth

Real GitHub login and repo loading use Vercel serverless functions under [`api/github`](./api/github).

Set these environment variables in Vercel before using the GitHub flow:

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

The GitHub OAuth app callback URL should be:

```text
https://your-vercel-domain/api/github/callback
```

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```
