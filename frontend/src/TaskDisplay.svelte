<script type="ts">
    import { grabAssignment, grabSolution } from "./ksp-task-grabber";
    import { nonNull } from './helpers'
import App from "./App.svelte";
    export let taskId: string | null | undefined

    export let showSolution: boolean = false
    $: {
        taskId
        showSolution = false
    }
</script>
<style>
    div {
        text-align: justify;
    }
</style>

<div>
    {#if taskId != null}
    {#await grabAssignment(nonNull(taskId))}
        Načítám úlohu
    {:then task}
        {@html task.titleHtml}
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
