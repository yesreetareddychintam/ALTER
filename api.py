import json
from fastapi import APIRouter, File, HTTPException, UploadFile

from ..gemma import analyze_image, explain_counterfactual
from ..graph_engine import simulate
from ..hindsight import memory
from ..models import (
    ExplainRequest,
    MemorySaveRequest,
    MemorySearchRequest,
    SimulateRequest,
    WorldModel,
)

router = APIRouter(prefix="/api")


@router.get("/health")
async def health():
    return {"status": "ok", "service": "ALTER"}


@router.get("/demo")
async def demo():
    return {
        "system_name": "Payment Architecture",
        "summary": "A simple application architecture used for the ALTER demo.",
        "nodes": [
            {"id": "frontend", "name": "Frontend", "type": "application", "description": "User-facing web client"},
            {"id": "api", "name": "API Gateway", "type": "service", "description": "Routes requests to backend services"},
            {"id": "auth", "name": "Auth Service", "type": "service", "description": "Handles authentication"},
            {"id": "payment", "name": "Payment Service", "type": "service", "description": "Processes payments"},
            {"id": "database", "name": "Database", "type": "storage", "description": "Stores transactions and orders"},
            {"id": "order", "name": "Order Storage", "type": "storage", "description": "Persists order state"},
        ],
        "relationships": [
            {"source": "frontend", "target": "api", "type": "sends_to", "confidence": 1.0},
            {"source": "api", "target": "auth", "type": "requires", "confidence": 1.0},
            {"source": "api", "target": "payment", "type": "routes_to", "confidence": 1.0},
            {"source": "payment", "target": "database", "type": "depends_on", "confidence": 1.0},
            {"source": "payment", "target": "order", "type": "produces", "confidence": 1.0},
            {"source": "order", "target": "database", "type": "depends_on", "confidence": 1.0},
        ],
        "constraints": ["Payment persistence requires database availability."],
        "sequences": ["Frontend → API Gateway → Payment Service → Database"],
        "uncertainties": [],
    }


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Please upload an image file.")
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(413, "Image is too large. Maximum size is 15 MB.")
    try:
        return analyze_image(data, file.content_type)
    except Exception as exc:
        raise HTTPException(502, f"Gemma analysis failed: {exc}")


@router.post("/simulate")
async def simulate_route(request: SimulateRequest):
    try:
        return simulate(request.world_model, request.node_id, request.operation)
    except ValueError as exc:
        raise HTTPException(400, str(exc))


@router.post("/explain")
async def explain(request: ExplainRequest):
    try:
        return explain_counterfactual(
            request.world_model.model_dump(),
            request.change,
            request.counterfactual,
        )
    except Exception as exc:
        raise HTTPException(502, f"Explanation failed: {exc}")


@router.post("/memory/save")
async def memory_save(request: MemorySaveRequest):
    return await memory.retain(request.model_dump())


@router.get("/memory/history")
async def memory_history():
    from ..memory import history_local
    return {"items": history_local()}


@router.post("/memory/search")
async def memory_search(request: MemorySearchRequest):
    return {"items": await memory.recall(request.query)}
