import type { SimulationLinkDatum, SimulationNodeDatum } from "d3";
import type { TaskDescriptor, TasksFile } from "./task-loader";
import { createTaskMap } from "./task-loader";


export type TaskId = {
    id: string;
    task: TaskDescriptor;
} & SimulationNodeDatum;

function createNodes(tasks: TasksFile, old?: TaskId[]): TaskId[] {
    return tasks.tasks.map((t) => {
        return { id: t.id, task: t };
    });
}

export function createNodesAndEdges(tasks: TasksFile, oldNodes?, oldEdges?): [TaskId[], SimulationLinkDatum<TaskId>[]] {
    let nodes = createNodes(tasks, oldNodes);

    // create mapping from ID to node
    let nodeMap = new Map<string, TaskId>();
    for (let task of nodes) {
        if (task.id in nodeMap) throw 'duplicate IDs';
        nodeMap.set(task.id, task);
    }

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
