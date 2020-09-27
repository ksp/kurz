<script lang="ts">
    import type { SimulationLinkDatum } from "d3";

    import { onMount } from "svelte";
  
    import type { TaskDescriptor } from "./task-loader";
  
    export let edge: SimulationLinkDatum<TaskDescriptor>;
  
    $: x1 = edge === undefined || edge.source === undefined || edge.source.x === undefined ? 0 : edge.source.x;
    $: y1 = edge === undefined || edge.source === undefined || edge.source.y === undefined ? 0 : edge.source.y;
    $: x2 = edge === undefined || edge.target === undefined || edge.target.x === undefined ? 0 : edge.target.x;
    $: y2 = edge === undefined || edge.target === undefined || edge.target.y === undefined ? 0 : edge.target.y;
</script>
  
 <line {x1} {x2} {y1} {y2} style="stroke: #aaa" />
  