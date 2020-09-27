<script lang="ts">
  import { onMount } from "svelte";

  import type { TaskDescriptor } from "./task-loader";

  export let task: TaskDescriptor;
  let hovering: boolean = false;
  let text_element: SVGTextElement;

  $: cx = task === undefined || task.x === undefined ? 0 : task.x;
  $: cy = task === undefined || task.y === undefined ? 0 : task.y;

  function enter() {
    hovering = true;
  }

  function leave() {
    hovering = false;
  }

  let ellipse_rx = 20;
  let ellipse_ry = 20;
  onMount(() => {
    const bbox = text_element.getBBox();
    ellipse_rx = bbox.width / 2 + 8;
    ellipse_ry = bbox.height / 2 + 8;
  });
</script>

<style>
  g:hover > ellipse {
    fill: #ffb3a2
  }
  ellipse {
    fill: #69b3a2
  }
</style>

<g on:mouseenter={enter} on:mouseleave={leave}>
  <ellipse rx={ellipse_rx} ry={ellipse_ry} {cx} {cy} />
  <text
    bind:this={text_element}
    x={cx}
    y={cy + 5}
    text-anchor="middle"
    alignment-baseline="middle">
    {task.id}
  </text>
</g>
