<script lang="ts">
  import Graph from "./Graph.svelte";
  import type { TasksFile } from "./tasks";
  import TasksLoader from "./TasksLoader.svelte";
  import TaskPanel from "./TaskPanel.svelte";
  import { loadAggregatedTasks } from "./aggregate-tasks";

  const tasksPromise: Promise<TasksFile> = loadAggregatedTasks()

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
