<script lang="ts">
    import type { TaskEdge } from "./graph";
  
    export let edge: TaskEdge;
    export let showLabelEdge: boolean = false;
    
    $: [x1, y1] = edge?.dependency?.position ?? [0,0];
    $: [x2, y2] = edge?.dependee?.position ?? [0, 0];
    $: dx = x1 - x2
    $: dy = y1 - y2
</script>

{#if showLabelEdge || (edge?.dependee?.type ?? null) != "label"}
    <path d="m {x2} {y2+0} c 0 0 {dx} {dy-40} {dx} {dy-20}" style="fill:none; stroke: #aaa; stroke-width: 3px" />
{/if}
