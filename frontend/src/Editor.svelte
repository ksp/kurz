<script type="ts">
  import Graph from "./Graph.svelte";
  import { nonNull } from "./helpers";
  import { grabAssignment } from "./ksp-task-grabber";
  import type { TaskDescriptor, TasksFile } from "./task-loader";
  import { saveTasks, createTaskMap, getCategories } from "./task-loader";
  import TaskDisplay from "./TaskDisplay.svelte";

  export let tasks: TasksFile;

  let selectedTask: string | null = null;
  let clickedTask: string | null = null;
  let repulsionForce: number = -600;
  let clicked: string[] = [];

  function clickTask(e: CustomEvent<TaskDescriptor>) {
    // sanity check
    if (selectedTask == null) {
      alert("tohle je divny event");
      return;
    }

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

      // run simulation
      toggleDivnaPromena();
    } else {
      alert("Nope, prvni musis nekam klikat...");
    }
  }

  let hovnoDivnaPromenaKteraJeFaktFuj = true;
  function toggleDivnaPromena() {
    hovnoDivnaPromenaKteraJeFaktFuj = !hovnoDivnaPromenaKteraJeFaktFuj;
  }

  async function saveCurrentState() {
    await saveTasks(tasks);
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
    height: 99vh;
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
    overflow-y: auto;
  }

  .lastClicked {
    height: 5%;
  }
</style>

<div class="container">
  <div class="left">
    <div class="lastClicked">Last clicked: <b>{clicked.join(' | ')}</b></div>
    <div class="graph">
      <Graph
        {tasks}
        {repulsionForce}
        bind:selectedTask
        on:selectTask={clickTask}
        runSimulationWeirdHack={hovnoDivnaPromenaKteraJeFaktFuj} />
    </div>
  </div>
  <div class="right">
    <div class="toolbox">
      <div>Toolbox</div>
      <div>
        <button on:click={addEdge}>Pridat hranu - posledni vyzaduje predposledni</button>
      </div>
      <div><button on:click={toggleDivnaPromena}>Spustit simulaci</button></div>
      <div>
        Repulsion force: <input type="number" bind:value={repulsionForce} name="repulsionForceInput" max="1000" min="-10000" />
      </div>
      <div>
        <button on:click={saveCurrentState}>Uložit aktuální stav</button>
      </div>
    </div>
    <div class="taskDetails">
      {#if currentTask != null}
        <h3>{currentTask}</h3>
        <span>{nonNull(taskMap.get(currentTask)).comment}</span>
        <ul>
          {#each getCategories(tasks, currentTask) as cat}
            <li>{cat}</li>
          {/each}
        </ul>
        <TaskDisplay taskId={currentTask} />
      {:else}
        <h3>Nothing selected...</h3>
      {/if}
    </div>
  </div>
</div>
