import networkx as nx
from .models import WorldModel


def build_graph(world_model: WorldModel) -> nx.DiGraph:
    graph = nx.DiGraph()
    for node in world_model.nodes:
        graph.add_node(node.id, name=node.name, type=node.type, description=node.description)
    for edge in world_model.relationships:
        if edge.source in graph and edge.target in graph:
            graph.add_edge(
                edge.source,
                edge.target,
                relation=edge.type,
                confidence=edge.confidence,
            )
    return graph


def simulate(world_model: WorldModel, node_id: str, operation: str = "remove") -> dict:
    graph = build_graph(world_model)

    if node_id not in graph:
        raise ValueError(f"Unknown node: {node_id}")

    direct = list(graph.successors(node_id))
    downstream = list(nx.descendants(graph, node_id))
    indirect = [n for n in downstream if n not in direct]

    affected = set(downstream) | ({node_id} if operation == "disable" else set())

    unaffected = [
        n for n in graph.nodes
        if n not in affected and n != node_id
    ]

    broken = []
    for target in downstream:
        if graph.has_edge(node_id, target):
            broken.append({
                "source": node_id,
                "target": target,
                "relationship": graph.edges[node_id, target].get("relation", "depends_on"),
            })

    node_names = {
        n: graph.nodes[n].get("name", n)
        for n in graph.nodes
    }

    return {
        "change": f"{operation} {node_names[node_id]}",
        "operation": operation,
        "removed_or_changed_node": {
            "id": node_id,
            "name": node_names[node_id],
        },
        "direct_impacts": [
            {"id": n, "name": node_names[n]} for n in direct
        ],
        "indirect_impacts": [
            {"id": n, "name": node_names[n]} for n in indirect
        ],
        "broken_dependencies": broken,
        "unaffected_components": [
            {"id": n, "name": node_names[n]} for n in unaffected
        ],
        "assumptions": [
            "Impact propagation follows the relationships extracted into the supplied graph."
        ],
        "unknowns": world_model.uncertainties,
        "cascade_depth": max([nx.shortest_path_length(graph, node_id, n) for n in downstream], default=0),
    }
