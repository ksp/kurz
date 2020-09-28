import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export type TaskDescriptor = {
    id: string
    requires: string[]
    comment?: string
}

export type TasksFile = {
    tasks: TaskDescriptor[]
    clusters: { [name: string]: string[] }
}

export type TaskMap = Map<string, TaskDescriptor>;

export async function loadTasks(): Promise<TasksFile> {
    const r = await fetch("/tasks.json")
    return await r.json()
}

export async function saveTasks(tasks: TasksFile) {
    // request options
    const options = {
        method: 'POST',
        body: JSON.stringify(tasks, null, 4),
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
