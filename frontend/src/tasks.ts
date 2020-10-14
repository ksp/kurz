import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export type TaskDescriptor = {
    id: string
    title?: string
    requires: string[]
    comment?: string
    position?: [number, number]
    hidden?: boolean
} & (
        {
            type: "open-data",
            taskReference: string
        }
        |
        {
            type: "text",
            htmlContent: string
        }
        |
        {
            type: "label",
            rotationAngle?: number
        }
    );

export type TasksFile = {
    tasks: TaskDescriptor[]
    clusters: { [name: string]: string[] }
}

export type TaskMap = Map<string, TaskDescriptor>;

export type TaskEdge = {
    dependee: TaskDescriptor
    dependency: TaskDescriptor
}

export function createEdges(nodes: TaskDescriptor[]): TaskEdge[] {
    let edges: TaskEdge[] = [];
    for (const n of nodes) {
        for (const r of n.requires) {
            const a = nodes.find((t) => t.id == r);
            if (a == undefined) throw `broken dependency, missing task with ${r}`
            edges.push({dependee: a, dependency: n})
        }
    }
    return edges
}

export async function loadTasks(): Promise<TasksFile> {
    const r = await fetch("/tasks.json")
    const j = await r.json()
    return j
}

function normalizeTasks(tasks: TasksFile) {
    tasks.tasks.sort((t1, t2) => t1.id.localeCompare(t2.id))
}

export function tasksToString(tasks: TasksFile): string {
    normalizeTasks(tasks);
    return JSON.stringify(tasks, null, 4)
}

export async function saveTasks(tasks: TasksFile) {
    // request options
    const options = {
        method: 'POST',
        body: tasksToString(tasks),
        headers: {
            'Content-Type': 'application/json'
        }
    }

    await fetch("/tasks.json", options)
}

export function createTaskMap(tasks: TasksFile): TaskMap {
    let m = new Map<string, TaskDescriptor>();

    for (let task of tasks.tasks) {
        if (task.id in m) throw 'duplicate IDs in tasks.json';

        m.set(task.id, task);
    }

    return m;
}

export function getCategories(tasks: TasksFile, taskId: string): string[] {
    let res: string[] = [];
    for (let [cat, ids] of Object.entries(tasks.clusters)) {
        if (ids.indexOf(taskId) >= 0) res.push(cat);
    }

    return res;
}
