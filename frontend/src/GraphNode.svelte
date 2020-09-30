<script lang="ts">
  import * as d3 from "d3";

  import { createEventDispatcher, onMount } from "svelte";
  import type { TaskId } from "./graph-types";
  import type { TaskStatus } from "./ksp-task-grabber";

  export let task: TaskId;
  export let draggingEnabled: boolean = false;
  export let status: TaskStatus | undefined = undefined

  let hovering: boolean = false;
  let text_element: SVGTextElement;

  $: cx = task === undefined || task.x === undefined ? 0 : task.x;
  $: cy = task === undefined || task.y === undefined ? 0 : task.y;
  
  const eventDispatcher = createEventDispatcher()
  function enter() {
    hovering = true;
    eventDispatcher("hoveringChange", hovering)
  }

  function leave() {
    hovering = false;
    eventDispatcher("hoveringChange", hovering)
  }

  function click(e: MouseEvent) {
    eventDispatcher("click", e)
  }

  // automatically size the bubbles to fit the text
  let ellipse_rx = 20;
  onMount(() => {
    const bbox = text_element.getBBox();
    ellipse_rx = bbox.width / 2 + 8;
  });

  // dragging
  let dragging: boolean = false;
  function dragStart(e: MouseEvent) {
    if (!draggingEnabled) return;

    dragging = true;
    e.preventDefault()
    e.stopPropagation();
  }
  function drag(e: MouseEvent) {
    if (!draggingEnabled) return;
    if (!dragging) return;

    let [x, y] = d3.pointer(e);
    task.x = x;
    task.y = y;
    eventDispatcher("positionChange");
    e.preventDefault()
    e.stopPropagation()
  }
  function dragStop(e: MouseEvent) {
    if (!draggingEnabled) return;

    dragging = false;
    e.preventDefault();
    e.stopPropagation();
  }

  function dblclick(e: MouseEvent) {
    eventDispatcher("dblclick", e);
    e.stopPropagation()
    e.preventDefault()
  }
</script>

<style>
  g {
    cursor: pointer;
  }
  g:hover > ellipse {
    fill: #ffb3a2
  }
  ellipse {
    fill: #69b3a2
  }
  .submitted ellipse {
    fill: red
  }
</style>

<g on:mouseenter={enter} on:mouseleave={leave} on:click={click} on:mousedown={dragStart} on:mouseup={dragStop} on:mousemove={drag} class={status && status.submitted ? "submitted" : ""} on:dblclick={dblclick}>
  <ellipse rx={ellipse_rx} ry={20} {cx} {cy} />
  <text
    bind:this={text_element}
    x={cx}
    y={cy + 5}
    text-anchor="middle"
    alignment-baseline="middle">
    {task.task.title == null ? task.id : task.task.title}
  </text>
</g>
