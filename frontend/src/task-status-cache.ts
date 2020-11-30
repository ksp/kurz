import { isLoggedIn } from "./ksp-task-grabber"
import { grabTaskSummary } from './ksp-submit-api'
import type { TaskStatus } from "./ksp-submit-api"
import { readable } from 'svelte/store';

let writeFn: (value: Map<string, TaskStatus>) => void = null!;
let lastVal = new Map<string, TaskStatus>()
if (isLoggedIn()) {
    const cachedTaskStatuses = localStorage.getItem("taskStatuses-cache")
    if (cachedTaskStatuses) {
        lastVal = new Map(JSON.parse(cachedTaskStatuses))
    }
}
export const taskStatuses = readable(lastVal, write => {
    writeFn = v => { lastVal = v; write(v); }
})

export function refresh() {
    if (!isLoggedIn()) return;

    return grabTaskSummary().then(t => {
        const tt = Array.from(t.entries())
        writeFn(new Map(Array.from(lastVal.entries()).concat(tt)))
        localStorage.setItem("taskStatuses-cache", JSON.stringify(tt))
    })
}

refresh()
