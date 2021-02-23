<script lang="ts">
  import Graph from "./Graph.svelte";
  import { loadTasks } from "./tasks";
  import type { TasksFile, TaskDescriptor } from "./tasks";
  import TasksLoader from "./TasksLoader.svelte";
  import TaskPanel from "./TaskPanel.svelte";
import { loadCurrentTasks, parseTaskId } from "./ksp-task-grabber";

  const tasksPromise: Promise<TasksFile> = (async function() {
    const [declaredTasks, currentTasks] = await Promise.all([loadTasks(), loadCurrentTasks()])
    const hLabel = declaredTasks.tasks.find(t => t.id == "current-tasks-h-label")
    const zLabel = declaredTasks.tasks.find(t => t.id == "current-tasks-z-label")
    const [hPosition, zPosition] = [ hLabel, zLabel ].map(t => t && t.position)
    if (hPosition && zPosition) {
      function positionTasks(z: boolean) {
          const pos = z ? zPosition : hPosition
          return currentTasks.filter(x => parseTaskId(x.id)!.z == z)
                             .map<TaskDescriptor>((x, i) => ({ ...x, position: [pos![0], pos![1] + (i+1) * 60] }))
      }
      declaredTasks.tasks = [
          declaredTasks.tasks,
          positionTasks(true),
          positionTasks(false),
      ].flat()
    }

    return declaredTasks
    
  })()

  // react to hash changes
  let hash = window.location.hash.substr(1);
  window.onhashchange = () => {
    hash = window.location.hash.substr(1);
    window.setTimeout(() => window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    }), 50)
  };
  $: selectedTaskId = (/^task\/([^\/]*)/.exec(hash) || [null, null])[1];
</script>

<style>
  main {
    text-align: center;
    margin: 0 auto;
    min-height: 420px;
  }
</style>

<main>
  <TasksLoader promise={tasksPromise} let:data={t}>
    <TaskPanel tasks={t} {selectedTaskId} />
    <div style="height: 100%">
      <Graph
        tasks={t}
        on:closeTask={() => { location.hash = ""}}
        on:selectTask={(e) => { if (e.detail.type != "label") (location.hash = `#task/${e.detail.id}`)}}/>
    </div>
  </TasksLoader>
</main>
