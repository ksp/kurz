<script type="ts">
    import { grabAssignment } from "./ksp-task-grabber";
    import { nonNull } from './helpers'
    export let task: string | null | undefined
</script>
<style>
    div {
        text-align: justify;
    }
</style>

<div>
    {#if task != null}
    {#await grabAssignment(nonNull(task))}
        Načítám úlohu
    {:then task}
        {@html task.titleHtml}
        <hr>
        {@html task.description}
        <div class="clearfloat" />
    {/await}
    {/if}
</div>
