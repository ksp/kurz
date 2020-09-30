import { grabTaskStates, isLoggedIn} from "./ksp-task-grabber"
import type { TaskStatus } from "./ksp-task-grabber"
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

console.log(isLoggedIn())



export function refresh(ids: string[]) {
    if (!isLoggedIn()) return;

    grabTaskStates(ids).then(t => {
        const tt = Array.from(t.entries())
        writeFn(new Map(Array.from(lastVal.entries()).concat(tt)))
        localStorage.setItem("taskStatuses-cache", JSON.stringify(tt))
    })
}
