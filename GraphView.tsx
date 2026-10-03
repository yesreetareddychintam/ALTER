import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node as RFNode,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

type Props = {
  worldModel: any;
  result?: any;
  onSelect: (id: string) => void;
  selected?: string;
};

export default function GraphView({ worldModel, result, onSelect, selected }: Props) {
  const { nodes, edges } = useMemo(() => {
    const cols = 3;
    const direct = new Set((result?.direct_impacts || []).map((x: any) => x.id));
    const indirect = new Set((result?.indirect_impacts || []).map((x: any) => x.id));
    const removed = result?.removed_or_changed_node?.id;

    const nodes: RFNode[] = (worldModel?.nodes || []).map((n: any, i: number) => {
      let status = "normal";
      if (n.id === removed) status = "removed";
      else if (direct.has(n.id)) status = "direct";
      else if (indirect.has(n.id)) status = "indirect";
      else if (n.id === selected) status = "selected";

      return {
        id: n.id,
        position: { x: (i % cols) * 250, y: Math.floor(i / cols) * 130 },
        data: { label: <div><strong>{n.name}</strong><small>{n.type}</small></div> },
        className: `graph-node ${status}`,
      };
    });

    const edges: Edge[] = (worldModel?.relationships || []).map((e: any, i: number) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      label: e.type,
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: !!result && (result.broken_dependencies || []).some(
        (b: any) => b.source === e.source && b.target === e.target
      ),
      className: !!result && (result.broken_dependencies || []).some(
        (b: any) => b.source === e.source && b.target === e.target
      ) ? "broken-edge" : "",
    }));

    return { nodes, edges };
  }, [worldModel, result, selected]);

  return (
    <div className="graph-wrap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        onNodeClick={(_, node) => onSelect(node.id)}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
