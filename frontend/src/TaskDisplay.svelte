<script type="ts">
    import { grabAssignment, grabSolution } from "./ksp-task-grabber";
    import type { TaskStatus } from "./ksp-task-grabber";
    import { nonNull } from './helpers'
import App from "./App.svelte";
import { taskStatuses } from "./task-status-cache";
    export let taskId: string | null | undefined

    export let showSolution: boolean = false
    $: {
        taskId
        showSolution = false
    }

    let status: TaskStatus | undefined
    $: if (taskId) status = $taskStatuses.get(taskId)
</script>
<style>
    div {
        text-align: justify;
    }
    .header {
        display: flex;
        width: 100%;
        flex-direction: row;
    }
    .header div {
        flex-grow: 1;
    }
    .header .status {
        text-align: right;
        font-style: italic;
    }
</style>

<div>
    {#if taskId != null}
    {#await grabAssignment(nonNull(taskId))}
        Načítám úlohu
    {:then task}
        <div class="header">
            <div class="title"><h3>{task.name}</h3></div>

            <div class="status">
                <p>
                    {task.id} | {task.points} bodů
                    {#if status && status.submitted}
                        {#if nonNull(status).solved}
                        | Vyřešeno 🥳
                        {:else}
                        | odevzdáno za {nonNull(status).points} bod{ "ů yyy"[nonNull(status).points] ?? "ů" }
                        {/if}
                    {/if}
                </p>
            </div>
        </div>
        {@html task.description}
        <div class="clearfloat" />

        <div class="solution">
            {#if !showSolution}
            <a href="javasctipt:;"
               on:click|preventDefault|stopPropagation={() => showSolution = true}>
                Zobrazit řešení úlohy
            </a>
            {:else}
            <h4>Řešení</h4>
            {#await grabSolution(nonNull(taskId))}
                Načítám...
            {:then solution}
                {@html solution.description}
            {/await}
            {/if}
        </div>
    {/await}
    {/if}
</div>
