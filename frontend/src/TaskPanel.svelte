<script lang="ts">
    import type { TasksFile, TaskDescriptor } from "./tasks";
    import TaskDisplay from "./TaskDisplay.svelte";

    export let tasks: TasksFile;
    let selectedTask: TaskDescriptor | null = null
    export let selectedTaskId: string | null = null

    let heightClass: "closed" | "full" = "closed"



    let lastSelectedTaskId: string | null = null

    $: {
        if (selectedTaskId && lastSelectedTaskId != selectedTaskId) {
            heightClass = "full"
            selectedTask = tasks.tasks.find(t => t.id == selectedTaskId) ?? null
        } else {
            heightClass = "closed";
        }
        lastSelectedTaskId = selectedTaskId
    }

    function close() {
        heightClass = "closed"
        window.setTimeout(() => window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        }), 100)
        location.hash = ""
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            close()
        }
    }
</script>

<style>
    .panel {
        position: relative;
        width: calc(min(100%, 100vw - 20px));
        overflow: hidden;
        padding: 16px 100px 16px 100px;
        border: 1px solid #444444;
        border-bottom: 2px dashed #444444;
        background-color: #111111;
        box-sizing: border-box;
        z-index: 120;
        border-radius: 30px;
    }
    @media only screen and (max-width: 600px) {
        .panel {
            padding: 0 10px 10px 10px;
        }
    }
    /* Used when the panel is explicitly closed  */
    .panel.closed {
        display: none;
    }

    .panel.full {
        min-height: 420px;
        border-bottom: 2px solid #444444;
    }
    .closeButton {
        display: none;
        position: absolute;
        right: 0;
        top: 0;
        color: white;
        background-color: red;
        border: 0;
        cursor: pointer;
    }
    .closeButton::before {
        content: "X";
    }
    .panel.full .closeButton { display: inherit }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="panel {heightClass}"
     on:click={() => location.hash = `#task/${selectedTask?.id}`}>
    <TaskDisplay task={selectedTask} />
    <button type=button class="closeButton" on:click|stopPropagation={close}></button>
</div>
