<script type="ts">
  import Graph from "./Graph.svelte";
  import { grabAssignment } from "./ksp-task-grabber";
  import type { TaskDescriptor, TasksFile } from "./task-loader";
  import { createTaskMap, getCategories } from "./task-loader";

  export let tasks: TasksFile;

  let selectedTask: string | null = null;
  let clickedTask: string | null = null;

  let clicked: string[] = [];

  function clickTask(e: CustomEvent<TaskDescriptor>) {
    // ukladani seznamu poslednich kliknuti
    clicked.push(selectedTask);
    if (clicked.length > 3)
      clicked = clicked.slice(clicked.length - 3, clicked.length);
    clicked = clicked;

    // trackovani, kam se naposledy kliknulo
    if (clickedTask == selectedTask) {
      clickedTask = null;
    } else {
      clickedTask = selectedTask;
    }
  }

  $: taskMap = createTaskMap(tasks);
  $: currentTask = clickedTask != null ? clickedTask : selectedTask;

  function addEdge() {
    if (clicked.length > 1) {
      const first = clicked[clicked.length - 1];
      const second = clicked[clicked.length - 2];

      tasks.tasks.forEach((t) => {
        if (t.id == first) {
          t.requires.push(second);
          t = t;
        }
      });
      tasks = tasks;
    } else {
      alert("Nope, prvni musis nekam klikat...");
    }
  }

  let hovnoDivnaPromenaKteraJeFaktFuj = true;
  function toggleDivnaPromena() {
      hovnoDivnaPromenaKteraJeFaktFuj = ! hovnoDivnaPromenaKteraJeFaktFuj;
  }
</script>

<style>
  h3 {
    margin: 0;
    padding: 0;
  }

  .container {
    display: flex;
    flex-direction: row;
    margin: 0;
    height: 100vh;
    width: 100%;
  }

  .graph {
    width: 100%;
    margin: 0;
    background-color: black;
    height: 95%;
  }

  .right {
    width: 40vw;
    height: 100%;
  }

  .left {
    width: 60vw;
    height: 100%;
  }

  .toolbox {
    width: 100%;
    margin: 0;
    height: 50%;
    background-color: pink;
  }

  .taskDetails {
    width: 100%;
    margin: 0;
    height: 50%;
    background-color: aqua;
  }

  .lastClicked {
    height: 5%;
  }
</style>

<div class="container">
  <div class="left">
    <div class="lastClicked">Last clicked: <b>{clicked.join(' | ')}</b></div>
    <div class="graph">
      <Graph {tasks} bind:selectedTask on:selectTask={clickTask} runSimulationWeirdHack={hovnoDivnaPromenaKteraJeFaktFuj} />
    </div>
  </div>
  <div class="right">
    <div class="toolbox">
      <div>Toolbox</div>
      <div>
        <button on:click={addEdge}>Pridat hranu - posledni vyzaduje predposledni</button>
      </div>
      <div>
        <button on:click={toggleDivnaPromena}>Spustit simulaci</button>
      </div>
    </div>
    <div class="taskDetails">
      {#if currentTask != null}
        <h3>{currentTask}</h3>
        <span>{taskMap.get(currentTask).comment}</span>
        <ul>
          {#each getCategories(tasks, currentTask) as cat}
            <li>{cat}</li>
          {/each}
        </ul>
        <div>
          {#await grabAssignment(currentTask)}
            Loading...
          {:then text}
            {@html text}
          {/await}
        </div>
      {:else}
        <h3>Nothing selected...</h3>
      {/if}
    </div>
  </div>
</div>
