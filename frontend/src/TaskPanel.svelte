<script lang="ts">
    import { grabAssignment } from "./ksp-task-grabber";
    import type { TasksFile, TaskDescriptor } from "./task-loader";
import TaskDisplay from "./TaskDisplay.svelte";

    // export let tasks: TasksFile;
    let selectedTask: TaskDescriptor | null = null

    let heightClass: "collapsed" | "full" | "preview" = "collapsed"

    let taskPromise: Promise<string | null>


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

    export function select(task: TaskDescriptor) {
        selectedTask = task
        heightClass = "full"
    }

    $: {
        if (selectedTask != null)
            taskPromise = grabAssignment(selectedTask.id)
    }
</script>

<style>
    .panel {
        position: absolute;
        width: calc(100%-200px);
        background-color: #222;
        overflow: hidden;
        padding: 0 100px 0 100px;
    }
    .panel.collapsed:not(:hover) {
        display: none;
    }
    .panel.preview, .panel:not(.full):hover {
        height: 100px;
    }
    .panel.full {
        min-height: 100%;
    }
    .closeButton { display: none }
    .panel.full .closeButton { display: inherit }
</style>

<div class="panel {heightClass}"
     on:click={() => selectedTask && select(selectedTask)}>
    <TaskDisplay task={selectedTask?.id} />
    <button type=button class="closeButton" on:click|stopPropagation={() => heightClass = "collapsed"}>
        Zavřít
    </button>
</div>
