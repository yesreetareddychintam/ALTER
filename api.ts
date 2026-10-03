export const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function jsonFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail || "Request failed");
  }
  return body;
}

export async function getDemo() {
  return jsonFetch("/api/demo");
}

export async function analyzeImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  return jsonFetch("/api/analyze", { method: "POST", body: form });
}

export async function simulate(worldModel: any, nodeId: string, operation = "remove") {
  return jsonFetch("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ world_model: worldModel, node_id: nodeId, operation }),
  });
}

export async function explain(worldModel: any, change: string, counterfactual: any) {
  return jsonFetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ world_model: worldModel, change, counterfactual }),
  });
}

export async function saveMemory(payload: any) {
  return jsonFetch("/api/memory/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function history() {
  return jsonFetch("/api/memory/history");
}
