import type { SimulationLinkDatum, SimulationNodeDatum } from "d3";
import type { TaskDescriptor, TasksFile } from "./task-loader";
import { createTaskMap } from "./task-loader";


export type TaskId = {
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

function createNodes(tasks: TasksFile, old?: TaskId[]): TaskId[] {
    let m = (old == undefined) ? new Map<string, TaskId>() : toMapById(old);

    let res: TaskId[] = tasks.tasks.map((t) => {
        return { id: t.id, task: t };
    });

    for (let t of res) {
        if (tasks.positions.has(t.id)) {
            [t.x, t.y] = tasks.positions.get(t.id)!
        }
        if (m.has(t.id)) {
            Object.assign(t, m.get(t.id))
        }
    }

    return res;
}

export function createNodesAndEdges(tasks: TasksFile, oldNodes?: TaskId[], oldEdges?: SimulationLinkDatum<TaskId>[]): [TaskId[], SimulationLinkDatum<TaskId>[]] {
    let nodes = createNodes(tasks, oldNodes);

    // create mapping from ID to node
    let nodeMap = toMapById(nodes);

    let links: SimulationLinkDatum<TaskId>[] = [];
    for (const task of tasks.tasks) {
        const src = nodeMap.get(task.id)!;
        for (const id of task.requires) {
            const t = nodeMap.get(id);

            if (t === undefined) throw `missing task with id ${id}`;

            const l: SimulationLinkDatum<TaskId> =
            {
                source: src,
                target: t
            };
            links.push(l);
        }
    }

    return [nodes, links];    
}
