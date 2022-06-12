import type { SimulationLinkDatum, SimulationNodeDatum } from "d3";
import * as d3 from "d3";
import { createEdges } from "./tasks";
import type { TaskDescriptor, TasksFile } from "./tasks";

type TaskId = {
    id: string;
    task: TaskDescriptor;
} & SimulationNodeDatum;

function toMapById(nodes: TaskId[]): Map<string, TaskId> {
    let nodeMap = new Map<string, TaskId>();
    for (let task of nodes) {
        if (task.id in nodeMap)
            throw 'duplicate IDs';
        nodeMap.set(task.id, task);
    }
    return nodeMap;
}

function taskForce(): d3.Force<TaskId, undefined> {
    let myNodes: TaskId[] | null = null;
    let deps: Map<string, number> = new Map();
    let idMap: Map<string, TaskId> = new Map();

    function getNumberOfDeps(task: TaskId): number {
        if (deps.has(task.id)) return deps.get(task.id)!;

        if (task.task.requires.length == 0) return 0;

        let res = 0;
        for (let r of task.task.requires) {
            res += getNumberOfDeps(idMap.get(r)!) + 1;
        }
        deps.set(task.id, res);
        return res;
    }

    let force: d3.Force<TaskId, undefined> = function (alpha: number) {
        if (myNodes == null) throw 'nodes not initialized';

        for (let task of myNodes) {
            if (task.vy == null) {
                task.vy = 0
            }

            task.vy += getNumberOfDeps(task) * 25 * alpha;
        }
    }

    force.initialize = function (nodes: TaskId[]) {
        myNodes = nodes;
        idMap = toMapById(myNodes);
    }

    return force;
}

/**
 * 
 * @param nodes 
 * @param edges 
 * @param ticked function that gets run every tick of a running simulation
 */
export function forceSimulation(tasks: TasksFile, ticked: (positions: Map<string, [number, number]>) => void, repulsionForce?: number) {
    repulsionForce = repulsionForce ?? -1000;

    let nodes: TaskId[] = tasks.tasks.map(
        (t) => {
            return {
                id: t.id,
                task: t,
                x: (t.position ?? [0, 0])[0],
                y: (t.position ?? [0, 0])[1]
            }
        })
    let edges: SimulationLinkDatum<TaskId>[] = createEdges(tasks.tasks).map((e) => {
        return {
            // FIXME are we sure its not the other way round?
            source: nodes.find((n) => n.id == e.dependee.id)!,
            target: nodes.find((n) => n.id == e.dependency.id)!
        }
    });

    function tickHandler() {
        ticked(new Map(nodes.map((n) => [n.id!, [n.x!, n.y!]])))
    }

    // Let's list the force we wanna apply on the network
    let simulation = d3
        .forceSimulation(nodes) // Force algorithm is applied to data.nodes
        .force(
            "link",
            d3
                .forceLink<TaskId, SimulationLinkDatum<TaskId>>() // This force provides links between nodes
                .id(d => d.id) // This provide  the id of a node
                .links(edges) // and this the list of links
        )
        .force("charge", d3.forceManyBody().strength(repulsionForce)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("x", d3.forceX()) // attracts elements to the zero X coord
        .force("y", d3.forceY().strength(0.5)) // attracts elements to the zero Y coord
        .force("dependencies", taskForce())
        .on("tick", tickHandler)
        .on("end", tickHandler);
}
