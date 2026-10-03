import React, { useEffect, useMemo, useState } from "react";
import {
  Upload,
  Sparkles,
  GitBranch,
  History,
  Play,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Database,
  ChevronRight,
} from "lucide-react";
import GraphView from "./components/GraphView";
import { analyzeImage, explain, getDemo, history, saveMemory, simulate } from "./api";

type Tab = "analyze" | "experiments" | "memory";

export default function App() {
  const [tab, setTab] = useState<Tab>("analyze");
  const [worldModel, setWorldModel] = useState<any>(null);
  const [selected, setSelected] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    history().then((x) => setExperiments(x.items || [])).catch(() => {});
  }, []);

  const selectedNode = useMemo(
    () => worldModel?.nodes?.find((n: any) => n.id === selected),
    [worldModel, selected]
  );

  async function loadDemo() {
    setError("");
    setLoading("Loading demo system…");
    try {
      const data = await getDemo();
      setWorldModel(data);
      setSelected("");
      setResult(null);
      setExplanation(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading("");
    }
  }

  async function onUpload(file?: File) {
    if (!file) return;
    setError("");
    setLoading("Understanding visual system…");
    try {
      const data = await analyzeImage(file);
      setWorldModel(data);
      setSelected("");
      setResult(null);
      setExplanation(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading("");
    }
  }

  async function runSimulation() {
    if (!worldModel || !selected) return;
    setError("");
    setLoading("Mapping dependencies…");
    try {
      const r = await simulate(worldModel, selected, "remove");
      setResult(r);
      setLoading("Generating consequence explanation…");
      const exp = await explain(
        worldModel,
        `Remove ${selectedNode?.name || selected}`,
        r
      );
      setExplanation(exp);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading("");
    }
  }

  async function saveExperiment() {
    if (!worldModel || !result) return;
    setLoading("Saving experiment…");
    try {
      const saved = await saveMemory({
        system_name: worldModel.system_name,
        world_model: worldModel,
        change: result.change,
        result,
        explanation,
      });
      setExperiments((old) => [saved, ...old.filter((x) => x.id !== saved.id)]);
      setTab("experiments");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading("");
    }
  }

  function reset() {
    setResult(null);
    setExplanation(null);
    setSelected("");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={() => setTab("analyze")}>
          <div className="brand-mark"><Zap size={18} /></div>
          <div>
            <div className="brand-name">ALTER</div>
            <div className="brand-sub">Visual Counterfactual Intelligence</div>
          </div>
        </div>
        <nav>
          <button className={tab === "analyze" ? "active" : ""} onClick={() => setTab("analyze")}><GitBranch size={16}/> Analyze</button>
          <button className={tab === "experiments" ? "active" : ""} onClick={() => setTab("experiments")}><History size={16}/> Experiments</button>
          <button className={tab === "memory" ? "active" : ""} onClick={() => setTab("memory")}><Database size={16}/> Memory</button>
        </nav>
      </header>

      <main>
        {tab === "analyze" && (
          <>
            {!worldModel ? (
              <section className="hero">
                <div className="eyebrow"><Sparkles size={15}/> Gemma-powered visual reasoning</div>
                <h1>Don’t just understand<br/><span>what you see.</span></h1>
                <p className="hero-copy">
                  Turn a visual system into a dependency model, then experiment with changes before making them in the real world.
                </p>

                <div className="upload-card">
                  <label className="dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onUpload(e.target.files?.[0])}
                    />
                    <Upload size={30}/>
                    <strong>Upload a diagram, workflow or visual system</strong>
                    <span>PNG, JPG or WEBP · up to 15 MB</span>
                  </label>
                  <div className="or">or</div>
                  <button className="primary" onClick={loadDemo}><Play size={17}/> Try live demo</button>
                </div>

                <div className="feature-row">
                  <div><Sparkles/><b>Gemma 4</b><span>visual system extraction</span></div>
                  <div><GitBranch/><b>Graph reasoning</b><span>deterministic impact analysis</span></div>
                  <div><Database/><b>Memory</b><span>experiments & decisions</span></div>
                </div>
              </section>
            ) : (
              <section className="workspace">
                <div className="workspace-head">
                  <div>
                    <div className="eyebrow">System model</div>
                    <h2>{worldModel.system_name}</h2>
                    <p>{worldModel.summary}</p>
                  </div>
                  <div className="head-actions">
                    <button className="secondary" onClick={reset}><RotateCcw size={16}/> Reset</button>
                    {result && <button className="primary" onClick={saveExperiment}><Save size={16}/> Save experiment</button>}
                  </div>
                </div>

                <div className="workspace-grid">
                  <div className="panel graph-panel">
                    <div className="panel-head">
                      <div><b>System graph</b><span>Click a component to simulate a change</span></div>
                      <div className="legend">
                        <i className="dot normal"/> Normal
                        <i className="dot direct"/> Direct
                        <i className="dot indirect"/> Cascade
                        <i className="dot removed"/> Removed
                      </div>
                    </div>
                    <GraphView worldModel={worldModel} result={result} selected={selected} onSelect={setSelected}/>
                  </div>

                  <aside className="side">
                    <div className="panel">
                      <div className="panel-head"><b>Selected component</b></div>
                      {selectedNode ? (
                        <>
                          <h3>{selectedNode.name}</h3>
                          <p>{selectedNode.description}</p>
                          <div className="type-pill">{selectedNode.type}</div>
                          <button className="danger" onClick={runSimulation}><Zap size={16}/> What if I remove this?</button>
                        </>
                      ) : (
                        <div className="empty">Select a node on the graph to explore a counterfactual.</div>
                      )}
                    </div>

                    {result && (
                      <div className="panel result-panel">
                        <div className="panel-head"><b>Counterfactual result</b><span>{result.cascade_depth} level cascade</span></div>
                        <div className="change-banner"><AlertTriangle size={17}/><div><small>SIMULATED CHANGE</small><strong>{result.change}</strong></div></div>
                        <ResultList title="Directly affected" items={result.direct_impacts} kind="warn"/>
                        <ResultList title="Indirectly affected" items={result.indirect_impacts} kind="cascade"/>
                        <ResultList title="Unaffected" items={result.unaffected_components} kind="ok"/>
                        {result.broken_dependencies?.length > 0 && (
                          <div className="broken"><b>Broken dependencies</b>{result.broken_dependencies.map((x: any, i: number) => <div key={i}>{x.source} → {x.target}</div>)}</div>
                        )}
                      </div>
                    )}
                  </aside>
                </div>

                {explanation && (
                  <section className="insight-grid">
                    <div className="panel explanation">
                      <div className="eyebrow"><Sparkles size={14}/> Gemma explanation</div>
                      <h3>{explanation.summary}</h3>
                      <p>{explanation.why_it_happens}</p>
                      {explanation.affected_explanation?.length > 0 && (
                        <div className="mini-section"><b>Why affected</b><ul>{explanation.affected_explanation.map((x: any, i: number) => <li key={i}>{typeof x === "string" ? x : JSON.stringify(x)}</li>)}</ul></div>
                      )}
                    </div>
                    <div className="panel alternative">
                      <div className="eyebrow"><CheckCircle2 size={14}/> Safer alternative</div>
                      <h3>{explanation.safer_alternative}</h3>
                      <ol>{(explanation.migration_steps || []).map((x: string, i: number) => <li key={i}>{x}</li>)}</ol>
                    </div>
                  </section>
                )}
              </section>
            )}
          </>
        )}

        {tab === "experiments" && (
          <section className="page">
            <div className="eyebrow"><History size={15}/> Decision history</div>
            <h1>Experiments</h1>
            <p>Previous counterfactual simulations saved by ALTER.</p>
            {experiments.length === 0 ? (
              <div className="empty-card">No experiments yet. Run the demo and save your first counterfactual.</div>
            ) : (
              <div className="cards">
                {experiments.map((x, i) => (
                  <div className="experiment-card" key={x.id || i}>
                    <div className="card-icon"><GitBranch size={18}/></div>
                    <div>
                      <b>{x.system_name}</b>
                      <strong>{x.change}</strong>
                      <span>{new Date(x.timestamp).toLocaleString()}</span>
                    </div>
                    <ChevronRight size={17}/>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "memory" && (
          <section className="page">
            <div className="eyebrow"><Database size={15}/> Persistent context</div>
            <h1>Memory</h1>
            <p>ALTER remembers previous system experiments. Hindsight is used when configured; local persistence is the fallback.</p>
            <div className="memory-banner">
              <Database size={24}/>
              <div><b>Experiment memory</b><span>Store changes, impacts, assumptions and alternatives for later comparison.</span></div>
            </div>
            <div className="cards">
              {experiments.map((x, i) => (
                <div className="experiment-card" key={x.id || i}>
                  <div className="card-icon"><Save size={18}/></div>
                  <div><b>{x.system_name}</b><strong>{x.change}</strong><span>{x.result?.direct_impacts?.length || 0} direct · {x.result?.indirect_impacts?.length || 0} cascade</span></div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {loading && <div className="toast"><Sparkles size={16}/>{loading}</div>}
      {error && <div className="error-toast">{error}<button onClick={() => setError("")}>×</button></div>}
    </div>
  );
}

function ResultList({ title, items, kind }: { title: string; items: any[]; kind: string }) {
  return (
    <div className="result-list">
      <b>{title}</b>
      {items?.length ? items.map((x: any) => (
        <div className="result-item" key={x.id}><i className={`dot ${kind}`}/>{x.name}</div>
      )) : <span className="muted">None detected</span>}
    </div>
  );
}
