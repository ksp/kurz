import { loadCurrentTasks, parseTaskId } from "./ksp-task-grabber"
import type { TaskDescriptor } from "./tasks"
import { loadTasks } from "./tasks"

/** Load tasks from tasks.json and tasks from the currently running series as returned by the ksp-grabber.
 *  The currently active tasks are automatically positioned bellow the labels with id current-tasks-[hz]-label
 */
export async function loadAggregatedTasks() {
    // load all tasks in parallel
    const [declaredTasks, currentTasks] = await Promise.all([loadTasks(), loadCurrentTasks()])

    // find the labels to for relative positions
    const hLabel = declaredTasks.tasks.find(t => t.id == "current-tasks-h-label")
    const zLabel = declaredTasks.tasks.find(t => t.id == "current-tasks-z-label")
    const [hPosition, zPosition] = [ hLabel, zLabel ].map(t => t && t.position)
    if (hPosition && zPosition) {
        const positionTasks = function (category: "Z" | "H") {
            const pos = category == "Z" ? zPosition : hPosition
            return currentTasks.filter(x => parseTaskId(x.id)!.z == (category == "Z"))
                               .map<TaskDescriptor>((x, i) => ({
                                   ...x,
                                   position: [pos[0], pos[1] + (i+1) * 60],
                                   isCurrent: true
                               }))
        }
        declaredTasks.tasks.push(...positionTasks("Z"))
        declaredTasks.tasks.push(...positionTasks("Z"))
    }

    return declaredTasks
}
