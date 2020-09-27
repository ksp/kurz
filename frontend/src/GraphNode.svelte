<script lang="ts">
  import type { TaskDescriptor } from "./task-loader";
  import Hoverable from "./Hoverable.svelte";

  export let task: TaskDescriptor;

  $: cx = task === undefined || task.x === undefined ? 0 : task.x + 6;
  $: cy = task === undefined || task.y === undefined ? 0 : task.y - 6;
</script>

<Hoverable let:hovering={focused}>
  {#if !focused}
    <circle r="20" style="fill: #69b3a2" {cx} {cy} />
  {:else}
    <circle r="20" style="fill: #ffb3a2" {cx} {cy} />
  {/if} -->
  <text x={cx} y={cy}>{task.id}</text>
</Hoverable>
