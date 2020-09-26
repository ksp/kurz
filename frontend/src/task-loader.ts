export type TaskDescriptor = {
    id: string
    requires: []
    comment?: string
}


export type TasksFile = {
    tasks: TaskDescriptor[]
    clusters: { [name: string]: string[] }
}

export async function loadTasks(): Promise<TasksFile> {
    const r = await fetch("/tasks.json")
    return await r.json()
}
