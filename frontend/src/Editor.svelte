<script type="ts">
  import { getContext } from "svelte";

  import Graph from "./Graph.svelte";
  import { nonNull } from "./helpers";
  import type { TaskDescriptor, TasksFile } from "./task-loader";
  import { saveTasks, getCategories } from "./task-loader";
  import TaskDisplay from "./TaskDisplay.svelte";
  import TaskDetailEditor from "./TaskDetailEditor.svelte";

  export let tasks: TasksFile;

  let repulsionForce: number = -1000;
  let clicked: string[] = [];
  let graph: Graph;
  let currentTask: TaskDescriptor | null = null;
  let nodeDraggingEnabled: boolean = false;
  const { open } = getContext("simple-modal");

  function clickTask(e: CustomEvent<TaskDescriptor>) {
    // ukladani seznamu poslednich kliknuti
    clicked = [...clicked, e.detail.id];
    if (clicked.length > 3)
      clicked = clicked.slice(clicked.length - 3, clicked.length);
  }

  function startHovering(e: CustomEvent<TaskDescriptor>) {
    currentTask = e.detail;
  }

  function addEdge() {
    if (clicked.length > 1) {
      const first = clicked[clicked.length - 1];
      const second = clicked[clicked.length - 2];

      tasks.tasks.forEach((t) => {
        if (t.id == first) {
          t.requires = [...t.requires, second];
        }
      });
      tasks = tasks;
    } else {
      alert("Nope, prvni musis nekam klikat...");
    }
  }

  async function saveCurrentStateWithPositions() {
    tasks.positions = graph.getNodePositions();
    await saveTasks(tasks);
  }

  async function saveCurrentState() {
    await saveTasks(tasks);
  }

  function openTaskDetailEditor(e: CustomEvent<TaskDescriptor>) {
    open(
      TaskDetailEditor,
      { task: e.detail, tasks: tasks },
      { closeButton: false },
      { onClose: () => { console.log("callback invoked", tasks); tasks = tasks; }}
    );
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
    z-index: 20;
    position: relative;
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
        on:selectTask={clickTask}
        on:preSelectTask={startHovering}
        bind:this={graph}
        {nodeDraggingEnabled}
        on:openTask={openTaskDetailEditor} />
    </div>
  </div>
  <div class="right">
    <div class="toolbox">
      <div>Toolbox</div>
      <div>
        <button disabled={clicked.length <= 1} on:click={addEdge}>Přidat hranu {clicked[clicked.length - 2]}
          -&gt; {clicked[clicked.length - 1]}</button>
      </div>
      <div>
        <button on:click={graph.runSimulation}>Spustit simulaci</button>
      </div>
      <div>
        Repulsion force: <input type="number" bind:value={repulsionForce} name="repulsionForceInput" max="1000" min="-10000" />
      </div>
      <div>
        <button on:click={saveCurrentState}>Uložit aktuální stav</button>
      </div>
      <div>
        <button on:click={saveCurrentStateWithPositions}>Uložit aktuální stav
          včetně pozic nodů</button>
      </div>
      <div>
        <label>
          <input type="checkbox" bind:checked={nodeDraggingEnabled} /> Povolit přesouvání
          vrcholů
        </label>
      </div>
    </div>
    <div class="taskDetails">
      {#if currentTask != null}
        <h3>{currentTask.id}</h3>
        <span>{nonNull(currentTask).comment}</span>
        <ul>
          {#each getCategories(tasks, currentTask.id) as cat}
            <li>{cat}</li>
          {/each}
        </ul>
        <TaskDisplay taskId={currentTask.id} />
      {:else}
        <h3>Nothing selected...</h3>
      {/if}
    </div>
  </div>
</div>
