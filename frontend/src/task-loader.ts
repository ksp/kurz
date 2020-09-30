import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export type TaskDescriptor = {
    id: string
    title?: string
    requires: string[]
    comment?: string
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
            type: "label"
        }
    );

export type TasksFile = {
    tasks: TaskDescriptor[]
    clusters: { [name: string]: string[] }
    positions: Map<string, [number, number]>
}

export type TaskMap = Map<string, TaskDescriptor>;

export async function loadTasks(): Promise<TasksFile> {
    const r = await fetch("/tasks.json")
    const j = await r.json()
    if (j.positions == null)
        j.positions = new Map();
    else
        j.positions = new Map(Object.entries(j.positions))
    return j
}

export async function saveTasks(tasks: TasksFile) {
    let p: any = {}
    for (let [key, val] of tasks.positions.entries())
        p[key] = val;
    const data = { ...tasks, positions: p }

    // request options
    const options = {
        method: 'POST',
        body: JSON.stringify(data, null, 4),
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
