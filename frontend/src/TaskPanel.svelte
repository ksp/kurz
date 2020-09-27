<script lang="ts">
    import { grabAssignment } from "./ksp-task-grabber";
    import type { TasksFile, TaskDescriptor } from "./task-loader";

    // export let tasks: TasksFile;
    export let selectedTask: string | null = null
    export let finalSelect: boolean = false
    let mouse: boolean = false

    let height: string;
    $: height = selectedTask == null && !mouse ? "0" :
                finalSelect ? "100%" :
                "100px"

    let taskPromise: Promise<string | null>
    $: {
        if (selectedTask != null)
            taskPromise = grabAssignment(selectedTask)
    }
</script>

<style>
    .panel {
        position: absolute;
        width: 100%;
        background-color: #222;
        overflow: hidden;
    }
</style>

<div class="panel" style="height: {height}" on:mouseover={() => mouse = false} on:mouseout={() => mouse = false}>
    {#if selectedTask != null}
    {#await taskPromise}
        Načítám úložku {selectedTask} ;)
    {:then task}
        {@html task}
    {/await}
    <button type=button on:click={() => finalSelect = false}>
        Zavřít
    </button>
    {/if}
</div>
