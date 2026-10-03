import base64
import json
import os
import re
from typing import Any

try:
    from google import genai
    from google.genai import types
except Exception:
    genai = None
    types = None


WORLD_PROMPT = """You are ALTER, a visual counterfactual intelligence engine.

Your job is NOT simply to describe an image. Transform the visual artifact into a structured representation of the SYSTEM represented by that artifact.

Identify entities, relationships, dependencies, sequences, constraints and uncertainties. Never invent relationships.

Return ONLY valid JSON:
{
  "system_name": "",
  "summary": "",
  "nodes": [{"id":"","name":"","type":"","description":""}],
  "relationships": [{"source":"","target":"","type":"","confidence":0.0}],
  "constraints": [],
  "sequences": [],
  "uncertainties": []
}

Use relationship types such as depends_on, connects_to, sends_to, receives_from, precedes, contains, controls, requires, produces.

The output will be consumed by a deterministic graph engine. Do not provide a generic image description."""


EXPLAIN_PROMPT = """You are ALTER's counterfactual explanation engine.

Given an original world model, a proposed change, and deterministic graph analysis, explain the consequences. Do not invent dependencies. Distinguish confirmed graph impact from inference and uncertainty.

Return ONLY JSON:
{
  "summary":"",
  "why_it_happens":"",
  "affected_explanation":[],
  "unaffected_explanation":[],
  "uncertainties":[],
  "safer_alternative":"",
  "migration_steps":[]
}"""


def _client():
    key = os.getenv("GEMINI_API_KEY")
    if not key or genai is None:
        return None
    return genai.Client(api_key=key)


def _extract_json(text: str) -> Any:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.S)
        if not match:
            raise
        return json.loads(match.group(0))


def analyze_image(image_bytes: bytes, mime_type: str) -> dict:
    client = _client()
    if client is None:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    model = os.getenv("GEMINI_MODEL", "gemma-4-31b-it")
    image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    response = client.models.generate_content(
        model=model,
        contents=[image_part, WORLD_PROMPT],
        config=types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )
    return _extract_json(response.text)


def explain_counterfactual(world_model: dict, change: str, result: dict) -> dict:
    client = _client()
    if client is None:
        # A deterministic fallback keeps the app usable if AI is unavailable.
        affected = [x["name"] for x in result.get("direct_impacts", []) + result.get("indirect_impacts", [])]
        return {
            "summary": f"{change} affects {len(affected)} downstream component(s).",
            "why_it_happens": "The graph engine found downstream dependencies from the changed component.",
            "affected_explanation": affected,
            "unaffected_explanation": [x["name"] for x in result.get("unaffected_components", [])],
            "uncertainties": result.get("unknowns", []),
            "safer_alternative": "Introduce a replacement or migration layer before removing the dependency.",
            "migration_steps": [
                "Introduce the replacement dependency.",
                "Validate downstream consumers.",
                "Migrate traffic or state.",
                "Remove the old component after verification.",
            ],
        }

    model = os.getenv("GEMINI_MODEL", "gemma-4-31b-it")
    prompt = f"""{EXPLAIN_PROMPT}

WORLD MODEL:
{json.dumps(world_model, indent=2)}

PROPOSED CHANGE:
{change}

DETERMINISTIC GRAPH ANALYSIS:
{json.dumps(result, indent=2)}
"""
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
    )
    return _extract_json(response.text)
