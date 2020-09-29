<script lang="ts">
  import Graph from "./Graph.svelte";
  import { loadTasks } from "./task-loader";
  import type { TasksFile, TaskDescriptor } from "./task-loader";
  import TasksLoader from "./TasksLoader.svelte";
  import TaskPanel from "./TaskPanel.svelte";
  import Editor from "./Editor.svelte";
import GraphEdge from "./GraphEdge.svelte";
import type { detach } from "svelte/internal";

  const tasksPromise: Promise<TasksFile> = loadTasks();

  let taskPanel: TaskPanel

  // react to hash changes
  let hash = window.location.hash.substr(1);
  window.onhashchange = () => {
    hash = window.location.hash.substr(1);
  }
  $: selectedTaskId = (/^task\/([^\/]*)/.exec(hash) || [null, null])[1]
</script>

<style>
  main {
    text-align: center;
    margin: 0 auto;
    min-height: 420px;
  }
</style>

<main>
  {#if hash == 'editor'}
    <TasksLoader promise={tasksPromise} let:data={t}>
      <Editor tasks={t} />
    </TasksLoader>
  {:else}
    <TasksLoader promise={tasksPromise} let:data={t}>
      <TaskPanel tasks={t} bind:this={taskPanel} {selectedTaskId} />
      <div style="height: 100%">
        <Graph tasks={t}
               on:selectTask={e => location.hash=`#task/${e.detail.id}`}
               on:preSelectTask={e => taskPanel.preSelect(e.detail)}
               on:unPreSelectTask={e => taskPanel.unPreselect(e.detail)} />
      </div>
    </TasksLoader>
  {/if}
</main>
