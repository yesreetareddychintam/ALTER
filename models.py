from typing import Any, Literal
from pydantic import BaseModel, Field


class Node(BaseModel):
    id: str
    name: str
    type: str = "component"
    description: str = ""


class Relationship(BaseModel):
    source: str
    target: str
    type: str = "depends_on"
    confidence: float = Field(default=1.0, ge=0, le=1)


class WorldModel(BaseModel):
    system_name: str
    summary: str = ""
    nodes: list[Node] = []
    relationships: list[Relationship] = []
    constraints: list[str] = []
    sequences: list[str] = []
    uncertainties: list[str] = []


class SimulateRequest(BaseModel):
    world_model: WorldModel
    node_id: str
    operation: Literal["remove", "disable"] = "remove"


class ExplainRequest(BaseModel):
    world_model: WorldModel
    change: str
    counterfactual: dict[str, Any]


class MemorySaveRequest(BaseModel):
    system_name: str
    world_model: dict[str, Any]
    change: str
    result: dict[str, Any]
    explanation: dict[str, Any] | None = None


class MemorySearchRequest(BaseModel):
    query: str
