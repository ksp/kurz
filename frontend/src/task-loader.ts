import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";

export type TaskDescriptor = {
    id: string
    requires: string[]
    comment?: string
} & SimulationNodeDatum


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

    fetch("/tasks.json", options)
}

export function createTaskMap(tasks: TasksFile): TaskMap {
    let m = new Map<string, TaskDescriptor>();

    for (let task of tasks.tasks) {
        if (task.id in m) throw 'duplicate IDs in tasks.json';

        m.set(task.id, task);
    }

    return m;
}

export function createLinksFromTaskMap(tasks: TasksFile): SimulationLinkDatum<TaskDescriptor>[] {
    let links: SimulationLinkDatum<TaskDescriptor>[] = [];

    const taskMap = createTaskMap(tasks);

    for (const task of tasks.tasks) {
        for (const id of task.requires) {
            const t = taskMap.get(id);

            if (t === undefined) throw `missing task with id ${id}`;

            const l: SimulationLinkDatum<TaskDescriptor> = { source: t, target: task };
            links.push(l);
        }
    }

    return links;
}

export function getCategories(tasks: TasksFile, taskId: string): string[] {
    let res: string[] = [];
    for (let [cat, ids] of Object.entries(tasks.clusters)) {
        if (ids.indexOf(taskId) >= 0) res.push(cat);
    }

    return res;
}
