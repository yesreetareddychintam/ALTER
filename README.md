# ALTER — Visual Counterfactual Intelligence

> **Don't just understand what you see. Change it. See what happens.**

ALTER turns visual representations of systems—architecture diagrams, workflows, flowcharts, process diagrams and similar artifacts—into structured dependency graphs. Users can then run counterfactual experiments such as **"What if I remove this?"** and inspect direct impacts, downstream effects, broken dependencies, unaffected components and a suggested alternative.

## Core loop

```text
Visual artifact
      ↓
Gemma 4 visual understanding
      ↓
Structured world model
      ↓
Dependency graph
      ↓
"What if I change/remove X?"
      ↓
Deterministic counterfactual analysis
      ↓
Gemma explanation + safer alternative
      ↓
Hindsight / local memory
```

### Why Gemma matters

Gemma is the visual-to-world-model layer. It extracts entities, relationships, dependencies, sequences, constraints and uncertainty from the supplied visual artifact. The graph engine then performs deterministic traversal rather than asking the model to hallucinate consequences.

### Demo

The app includes a built-in architecture demo:

```text
Frontend → API Gateway → Auth Service
                    ↓
              Payment Service
                    ↓
                 Database
```

Select **Database → What if I remove this?** and ALTER highlights the resulting dependency cascade.

## Stack

- Frontend: React + TypeScript + Vite + CSS
- Backend: FastAPI + Python
- AI: Gemma 4 through the Gemini API
- Reasoning: NetworkX
- Memory: Hindsight adapter with local JSON fallback
- Deployment: Docker / Docker Compose; frontend can also be deployed to Vercel and backend to Render/Railway

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
# macOS/Linux:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

### Environment

Copy `.env.example` to `backend/.env` and set:

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemma-4-31b-it

HINDSIGHT_API_KEY=
HINDSIGHT_URL=
HINDSIGHT_BANK_ID=alter

FRONTEND_ORIGIN=http://localhost:5173
```

The app works in demo mode without an API key. Image analysis requires a working Gemma/Gemini API configuration.

> **Model name:** use the exact Gemma 4 model identifier enabled for your API/account. If `gemma-4-31b-it` is unavailable, set `GEMINI_MODEL` to the model identifier shown by your provider.

## API

- `GET /api/health`
- `GET /api/demo`
- `POST /api/analyze`
- `POST /api/simulate`
- `POST /api/explain`
- `POST /api/memory/save`
- `GET /api/memory/history`
- `POST /api/memory/search`

Interactive API docs are available at `/docs`.

## Hindsight

The memory layer is implemented behind a small adapter. If Hindsight credentials are supplied, the adapter attempts to use Hindsight. If unavailable, ALTER uses a local JSON store so the demo remains functional.

No fake Hindsight responses are generated.

## Docker

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Deployment

### Backend: Render/Railway/Fly/etc.

Use the `backend/Dockerfile` or:

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set environment variables from `.env.example`.

### Frontend: Vercel/Netlify/etc.

```bash
cd frontend
npm install
npm run build
```

Set:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
```

The `frontend/Dockerfile` can also be used for container deployment.

## Repository structure

```text
ALTER/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── gemma.py
│   │   ├── graph_engine.py
│   │   ├── hindsight.py
│   │   ├── memory.py
│   │   ├── models.py
│   │   └── routes/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── LICENSE
```

## Hackathon positioning

ALTER is intentionally not presented as "image analysis." Its distinctive interaction is **visual system → structured model → counterfactual change → impact analysis**.

Do not claim that no other system has ever explored related ideas. The project differentiates itself through this integrated workflow and its explicit separation of model perception from deterministic graph reasoning.

## License

MIT. See `LICENSE`.
