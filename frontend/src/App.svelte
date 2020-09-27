<script lang="ts">
  import Graph from "./Graph.svelte";
  import GraphNode from "./GraphNode.svelte";
  import { loadTasks } from "./task-loader";
  import type { TasksFile } from "./task-loader";
  import TasksLoader from "./TasksLoader.svelte";

  const tasksPromise: Promise<TasksFile> = loadTasks();
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
  <h1>Cool graf</h1>
  <!--
	<svg height=200 width=200>
	<GraphNode task="null" />
</svg>
-->
  <TasksLoader promise={tasksPromise} let:data={t}>
    <Graph tasks={t} />
  </TasksLoader>
</main>
