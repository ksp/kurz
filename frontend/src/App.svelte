<script lang="ts">
  import Graph from "./Graph.svelte";
  import { loadTasks } from "./tasks";
  import type { TasksFile, TaskDescriptor } from "./tasks";
  import TasksLoader from "./TasksLoader.svelte";
  import TaskPanel from "./TaskPanel.svelte";
  import Editor from "./Editor.svelte";
  import Modal from "svelte-simple-modal";

  const tasksPromise: Promise<TasksFile> = loadTasks();

  let taskPanel: TaskPanel;

  // react to hash changes
  let hash = window.location.hash.substr(1);
  window.onhashchange = () => {
    hash = window.location.hash.substr(1);
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
  <Modal>
    {#if hash == 'editor'}
      <TasksLoader promise={tasksPromise} let:data={t}>
        <Editor tasks={t} />
      </TasksLoader>
    {:else}
      <TasksLoader promise={tasksPromise} let:data={t}>
        <TaskPanel tasks={t} bind:this={taskPanel} {selectedTaskId} />
        <div style="height: 100%">
          <Graph
            tasks={t}
            on:selectTask={(e) => { if (e.detail.type != "label") (location.hash = `#task/${e.detail.id}`)}}
            on:closeTask={() => {location.hash = '#'}} />
        </div>
      </TasksLoader>
    {/if}
  </Modal>
</main>
