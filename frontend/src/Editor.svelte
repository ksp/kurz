<script type="ts">
  import { getContext } from "svelte";

  import Graph from "./Graph.svelte";
  import { isEditableElement, nonNull, saveToLocalDisk } from "./helpers";
  import type { TaskDescriptor, TasksFile } from "./tasks";
  import { loadTasks, resetTasks, saveTasks, getCategories, tasksToString } from "./tasks";
  import TaskDisplay from "./TaskDisplay.svelte";
  import TaskDetailEditor from "./TaskDetailEditor.svelte";
  import { forceSimulation } from "./force-simulation";
  import {
    refresh as refreshTaskStatuses,
    taskStatuses,
  } from "./task-status-cache";
  import { grabAssignment, isLoggedIn } from "./ksp-task-grabber";

  export let tasks: TasksFile;

  let repulsionForce: number = -1000;
  let clicked: string[] = [];
  let graph: Graph;
  let currentTask: TaskDescriptor | null = null;
  let nodeDraggingEnabled: boolean = true;
  let angle: number;
  let showHiddenEdges: boolean = false;
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

  function runSimulation() {
    forceSimulation(
      tasks,
      (positions) => {
        tasks.tasks.forEach((t) => (t.position = positions.get(t.id)));
        tasks = tasks;
      },
      repulsionForce
    );
  }

  async function saveCurrentState() {
    await saveTasks(tasks).catch((val) => {
      alert(val);
    });
  }

  async function resetCurrentState() {
    await resetTasks().catch((val) => {
      alert(val);
    })
    tasks = await loadTasks();
  }

  // autosave ;)
  let saveTimeoutHandle: NodeJS.Timeout | null = null;
  function autosave() {
    if (saveTimeoutHandle != null) clearTimeout(saveTimeoutHandle);

    saveTimeoutHandle = setTimeout(async () => {
      saveTimeoutHandle = null;
      await saveTasks(tasks);
    }, 5000);
  }
  $: {
    tasks;
    autosave();
  }

  function saveLocally() {
    saveToLocalDisk("/kurz/tasks.json", tasksToString(tasks));
  }

  function openTaskDetailEditorButton(e: CustomEvent<TaskDescriptor>) {
    openTaskDetailEditor(e.detail);
  }

  function openTaskDetailEditor(t: TaskDescriptor) {
    open(
      TaskDetailEditor,
      { task: t, tasks: tasks },
      { closeButton: false, styleWindow: { width: "50vw" } },
      {
        onClose: () => {
          tasks = tasks;
        },
      }
    );
  }

  function addTask() {
    let id = prompt("Zadej ID nové úlohy (nepůjde nikdy změnit):");
    if (id == null || id == "") {
      alert("Něco tam zadat musíš!");
      return;
    }

    let existing = tasks.tasks.find((t) => t.id == id);
    if (existing != undefined) {
      alert("úloha s tímto ID již existuje!");
      return;
    }

    let novaUloha: TaskDescriptor = {
      id: id,
      type: "label",
      comment: "...",
      requires: [],
    };

    tasks.tasks = [...tasks.tasks, novaUloha];

    openTaskDetailEditor(novaUloha);
  }

  function removeTask(id: string) {
    // zkontrolovat existenci
    let found = false;
    for (const t of tasks.tasks) {
      if (t.id == id) {
        found = true;
        break;
      }
    }

    if (!found) {
      alert("Pokoušíš se smazat úlohu, která neexistuje. To je docela divné!");
      return;
    }

    // existují závislosti na tuhle úlohu?
    let dependencyExists = false;
    for (const t of tasks.tasks) {
      for (const r of t.requires) {
        if (r == id) {
          dependencyExists = true;
          break;
        }
      }
    }
    if (dependencyExists) {
      alert(
        "Pokoušíš se smazat úlohu, na které je někdo jiný závislý! To nejde! Smaž první závislost."
      );
      return;
    }

    // je to bezpečné, mažeme
    tasks.tasks = tasks.tasks.filter((t) => t.id != id);
  }

  function getTask(id: string): TaskDescriptor | undefined {
    return tasks.tasks.find((t) => t.id == id);
  }

  function setAngleToTheCurrentLabel() {
    let t = getTask(clicked[clicked.length - 1]);
    if (clicked.length > 0 && t != undefined && t.type == "label") {
      t.rotationAngle = angle;
      tasks = tasks;
    }
  }

  async function loadYear() {
    if (!isLoggedIn()) {
      alert("Musíš se přihlásit");
      return;
    }
    const y = prompt("Který ročník (číslo 26...X)");
    await refreshTaskStatuses();
    const newTasks = Array.from($taskStatuses.values()).filter(
      (t) =>
        t.id.startsWith(y + "-") &&
        !tasks.tasks.find(
          (tt) => tt.type == "open-data" && tt.taskReference == t.id
        )
    );
    const newDescriptors: TaskDescriptor[] = newTasks.map((t) => ({
      type: "open-data",
      id: t.id,
      taskReference: t.id,
      requires: [],
      position: [0, 0],
      title: t.name,
      points: t.points!,
    }));
    tasks.tasks = [...tasks.tasks, ...newDescriptors];
  }

  async function loadMaxPoints() {
    const loadedTasks = await Promise.all(
      tasks.tasks.map(async (t) => {
        if (t.type != "open-data") {
          return t;
        }
        const a = await grabAssignment(t.taskReference);
        return { ...t, points: a.points! };
      })
    );

    tasks = { ...tasks, tasks: loadedTasks };

    alert("Načteno :)");
  }

  function hideSelection() {
    for (let t of graph.getCurrentSelection()) {
      t.hidden = true;
    }
    tasks = tasks;
  }

  function showSelection() {
    for (let t of graph.getCurrentSelection()) {
      t.hidden = false;
    }
    tasks = tasks;
  }

  function keydown(e: KeyboardEvent) {
    if (isEditableElement(document.activeElement)) {
      // another element has focus - ignore our shortcuts
      return
    }
    const shortcuts = {
      "z": showSelection,
      "s": hideSelection,
      "o": () => removeTask(clicked[clicked.length - 1]),
      "n": addTask,
      "h": addEdge,
      "<Ctrl>s": saveCurrentState,
      "r": () => { showHiddenEdges = !showHiddenEdges },
    } as { [name: string]: () => void }
    const keyCode = (e.ctrlKey ? "<Ctrl>" : "") + (e.shiftKey ? "<Shift>" : "") + e.key
    if (shortcuts[keyCode]) {
      shortcuts[keyCode]()
      e.stopPropagation()
      e.preventDefault()
    }
  }
</script>

<style>
  .container {
    margin: 0;
    height: 99vh;
    width: 100%;

    background-color: transparent;
  }

  .right {
    margin-right: 2em;
    float: right;
    width: 40vw;
    height: 100%;
    z-index: 20;
    position: relative;
  }

  .toolbox {
    width: 100%;
    height: 40%;
    background-color: #1d1f21f0;

    margin: 5px;
    border: 1px solid gray;
    padding: 5px;

    overflow-y: auto;
  }

  .taskDetails {
    width: 100%;
    margin: 0;
    height: 50%;
    overflow-y: auto;
    background-color: #1d1f21f0;

    margin: 5px;
    border: 1px solid gray;
    padding: 5px;
  }

  label {
    display: block;
  }

  input:disabled {
    color: #ccc;
  }
  button {
    font-family: inherit;
    font-size: inherit;
    padding: 0.4em;
    margin: 0 0 0.5em 0;
    width: 45%;
    border-radius: 0.5em;
    border: 2px solid white;
    background-color: transparent;
    color: white;
    transition: auto;
    box-sizing: border-box;
  }

  button:hover:not(:disabled) {
    background-color: #888;
  }

  button:active:not(:disabled) {
    background-color: #eee;
    color: black;
  }

  button:disabled {
    border-color: #aaa;
    color: #aaa;
  }

  .topLeftHint {
    text-align: left;
    padding-top: 1em;
    padding-left: 2em;
    width: 50%;
    height: 5%;
    float: left;
  }

  :global(body) {
    background-color: #1d1f21;
    color: white;
  }
  .checkbox {
    width: 45%;
    display: inline-block;
  }
  .gap {
    height: 1em;
  }
</style>

<svelte:window on:keydown={e => keydown(e)} />

<Graph
  {tasks}
  selectionToolEnabled={true}
  on:selectTask={clickTask}
  on:preSelectTask={startHovering}
  showCenterMarker={true}
  bind:this={graph}
  {nodeDraggingEnabled}
  on:openTask={openTaskDetailEditorButton}
  {showHiddenEdges}
  showHidden={true} />

<div class="container">
  <div class="topLeftHint">
    Last clicked: <b>{clicked.join(' | ')}</b><br /><i>Double click na node
      otevře detail. Po kliknutí na label se zobrazí možnost rotace. Držením
      pravého tlačítka je možné udělat skupinový výběr.</i>
  </div>

  <div class="right">
    <div class="toolbox">
      <h3>Toolbox</h3>
      <div>
        <button on:click={saveCurrentState}>Uložit aktuální stav [C+S]</button>
        <button on:click={resetCurrentState}>Resetovat aktuální stav</button>
      </div>
      <button on:click={saveLocally}>Stáhnout data lokálně</button>
      <div class="gap" />
      <div>
        <button on:click={addTask}>[N]ový node</button>
        <button
          disabled={clicked.length == 0}
          on:click={() => removeTask(clicked[clicked.length - 1])}>[O]dstranit {clicked[clicked.length - 1] ?? '???'}</button>
      </div>
      <div class="gap" />
      <div>
        <button disabled={clicked.length <= 1} on:click={addEdge}>Přidat [h]ranu {clicked[clicked.length - 2] ?? '???'}
          -&gt; {clicked[clicked.length - 1] ?? '???'}</button>
        <div class="checkbox">
          <label>
            <input type="checkbox" bind:checked={showHiddenEdges} /> Zob[r]azit skryté
            hrany
          </label>
        </div>
      </div>

      <div class="gap" />
      <div>
        <button on:click={runSimulation}>Spustit simulaci</button>
        <div class="checkbox">
          <label>
            <input type="checkbox" bind:checked={nodeDraggingEnabled} /> Povolit
            přesouvání vrcholů
          </label>
        </div>
      </div>
      <div>
        Repulsion force: <input type="number" bind:value={repulsionForce} name="repulsionForceInput" max="1000" min="-10000" />
      </div>
      <div class="gap" />
      {#if clicked.length > 0 && getTask(clicked[clicked.length - 1])?.type == 'label'}
        <div>
          Úhel rotace: <input bind:value={angle} type="range" max="360" min="0" on:change={setAngleToTheCurrentLabel} />
        </div>
      {/if}
      <div>
        <button
          on:click={loadYear}
          disabled={!isLoggedIn()}
          title={isLoggedIn() ? 'Nahraje všechny úlohy z jednoho ročníku, které tu ještě nejsou' : 'Je nutné být přihlášený a na stránce v KSP template.'}>
          Nahrát celý ročník
        </button>
        <button
          on:click={loadMaxPoints}
          title="Stáhne ke každé úloze maximální počet bodů">
          Aktualizovat počty bodů
        </button>
      </div>
      <div>
        <button on:click={hideSelection}>[S]krýt výběr</button>
        <button on:click={showSelection}>[Z]obrazit výběr</button>
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
        <TaskDisplay task={currentTask} />
      {:else}
        <h3>Nothing selected...</h3>
      {/if}
    </div>
  </div>
</div>
