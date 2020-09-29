<script lang="ts">
    import { grabAssignment } from "./ksp-task-grabber";
    import type { TaskAssignmentData } from "./ksp-task-grabber";
    import type { TasksFile, TaskDescriptor } from "./task-loader";
import TaskDisplay from "./TaskDisplay.svelte";

    export let tasks: TasksFile;
    let selectedTask: TaskDescriptor | null = null
    export let selectedTaskId: string | null = null

    let heightClass: "closed" | "collapsed" | "full" | "preview" = "collapsed"

    export function preSelect(task: TaskDescriptor) {
        if (heightClass != "full") {
            selectedTask = task
            heightClass = "preview"
        }
    }

    export function unPreselect(task: TaskDescriptor) {
        setTimeout(() => {
            if (selectedTask && task.id == selectedTask.id && heightClass != "full") {
                heightClass = "collapsed"
            }
        }, 10);
    }

    $: {
        if (selectedTaskId) {
            heightClass = "full"
            selectedTask = tasks.tasks.find(t => t.id == selectedTaskId) ?? null
        } else {
            heightClass = "collapsed"
        }
    }

    function close() {
        location.hash = ""
        heightClass = "closed"
        window.setTimeout(() => window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        }), 100)
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
        width: calc(min(100%, 100vw - 16px));
        background-color: #222;
        overflow: hidden;
        padding: 0 100px 0 100px;
        box-sizing: border-box;
        z-index: 120;
    }
    @media only screen and (max-width: 600px) {
        .panel {
            padding: 0 10px 10px 10px;
        }
    }
    /* Used when the panel is explicitly closed - collapsed would still show the hover preview */
    .panel.closed {
        display: none;
    }
    /* Used when the panel is implicitly closed - it does not disappear when there is mouse over it */
    .panel.collapsed:not(:hover) {
        display: none;
    }
    /* Used when the user hovers over a node and we want to show that there is something - a small expandable preview */
    .panel.preview, .panel:not(.full):hover {
        height: 100px;
    }
    .panel.full {
        min-height: 100%;
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
    <TaskDisplay taskId={selectedTask?.id} />
    <button type=button class="closeButton" on:click|stopPropagation={close}></button>
</div>
