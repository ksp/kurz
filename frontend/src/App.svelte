<script lang="ts">
  import Graph from "./Graph.svelte";
  import GraphNode from "./GraphNode.svelte";
  import { loadTasks } from "./task-loader";
  import type { TasksFile, TaskDescriptor } from "./task-loader";
  import TasksLoader from "./TasksLoader.svelte";
  import TaskPanel from "./TaskPanel.svelte";

  const tasksPromise: Promise<TasksFile> = loadTasks();

  let selectedTask: string | null = null
  let finalSelect: boolean = false

  function clickTask(e: CustomEvent<TaskDescriptor>) {
    finalSelect = true
  }

</script>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
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
  <!--
	<svg height=200 width=200>
	<GraphNode task="null" />
</svg>
-->
  <TasksLoader promise={tasksPromise} let:data={t}>
    <TaskPanel bind:finalSelect={finalSelect} selectedTask={selectedTask} />
    <Graph tasks={t} bind:selectedTask={selectedTask} on:selectTask={clickTask} />
  </TasksLoader>
</main>
