<script lang="ts">
  import Graph from "./Graph.svelte";
  import { loadTasks } from "./task-loader";
  import type { TasksFile, TaskDescriptor } from "./task-loader";
  import TasksLoader from "./TasksLoader.svelte";
  import TaskPanel from "./TaskPanel.svelte";
  import Editor from "./Editor.svelte";

  const tasksPromise: Promise<TasksFile> = loadTasks();

  let selectedTask: string | null = null;
  let finalSelect: boolean = false;

  function clickTask(e: CustomEvent<TaskDescriptor>) {
    finalSelect = true;
  }

  // react to hash changes
  let hash = window.location.hash.substr(1);
  window.onhashchange = () => {
	hash = window.location.hash.substr(1);
  }
</script>

<style>
  main {
    text-align: center;
    max-width: 240px;
    margin: 0 auto;
    min-height: 420px;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  {#if hash == 'editor'}
    <TasksLoader promise={tasksPromise} let:data={t}>
      <Editor tasks={t} />
    </TasksLoader>
  {:else}
    <TasksLoader promise={tasksPromise} let:data={t}>
      <TaskPanel bind:finalSelect {selectedTask} />
      <div style="height: 100%">
        <Graph tasks={t} bind:selectedTask on:selectTask={clickTask} />
      </div>
    </TasksLoader>
  {/if}
</main>
