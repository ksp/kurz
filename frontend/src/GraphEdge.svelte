<script lang="ts">
    import type { TaskEdge } from "./graph";

    export let edge: TaskEdge;
    export let showLabelEdge: boolean = false;

    $: [x1, y1] = edge?.dependency?.position ?? [0, 0];
    $: [x2, y2] = edge?.dependee?.position ?? [0, 0];
    $: dx = x1 - x2;
    $: dy = y1 - y2;

    $: hidden =
        (edge?.dependee?.hidden ?? false) ||
        (edge?.dependency?.hidden ?? false);
</script>

<style>
    .hidden {
        stroke-opacity: 0.5;
        fill-opacity: 0.5;
    }
</style>

{#if showLabelEdge || (edge?.dependee?.type ?? null) != 'label'}
    <path
        d="m {x2} {y2 + 0} c 0 0 {dx} {dy - 40} {dx} {dy - 20}"
        style="fill:none; stroke: #aaa; stroke-width: 3px"
        class={hidden ? 'hidden' : ''} />
{/if}
