<script lang="ts">
    import type { SimulationLinkDatum } from "d3";
    import type { TaskId } from "./graph-types";
  
    export let edge: SimulationLinkDatum<TaskId>;
  
    $: x1 = edge?.source?.x ?? 0;
    $: y1 = edge?.source?.y ?? 0;
    $: x2 = edge?.target?.x ?? 0;
    $: y2 = edge?.target?.y ?? 0;
    $: dx = x1 - x2
    $: dy = y1 - y2
</script>

<path d="m {x2} {y2+0} c 0 0 {dx} {dy-40} {dx} {dy-20}" style="fill:none; stroke: #aaa; stroke-width: 3px" />
