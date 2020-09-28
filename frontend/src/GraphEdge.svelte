<script lang="ts">
    import type { SimulationLinkDatum } from "d3";
    import type { TaskId } from "./graph-types";
  
    export let edge: SimulationLinkDatum<TaskId>;
  
    $: x1 = edge === undefined || edge.source === undefined || edge.source.x === undefined ? 0 : edge.source.x;
    $: y1 = edge === undefined || edge.source === undefined || edge.source.y === undefined ? 0 : edge.source.y;
    $: x2 = edge === undefined || edge.target === undefined || edge.target.x === undefined ? 0 : edge.target.x;
    $: y2 = edge === undefined || edge.target === undefined || edge.target.y === undefined ? 0 : edge.target.y;
</script>
  
 <line x1={x1+10} y1={y1} {x2} {y2} style="stroke: #aaa" />
 <line x1={x1} y1={y1+10} {x2} {y2} style="stroke: #aaa" />
 <line x1={x1-10} y1={y1} {x2} {y2} style="stroke: #aaa" />
 <line x1={x1} y1={y1-10} {x2} {y2} style="stroke: #aaa" />
  