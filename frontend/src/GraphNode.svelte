<script lang="ts">
  import * as d3 from "d3";

  import { createEventDispatcher, onMount } from "svelte";
  import type { TaskId } from "./graph-types";
  import type { TaskStatus } from "./ksp-task-grabber";

  export let task: TaskId;
  export let draggingEnabled: boolean = false;
  export let status: TaskStatus | undefined = undefined;

  let hovering: boolean = false;
  let text_element: SVGTextElement;
  let mainGroup: SVGGElement;

  $: cx = task === undefined || task.x === undefined ? 0 : task.x;
  $: cy = task === undefined || task.y === undefined ? 0 : task.y;

  const eventDispatcher = createEventDispatcher();
  function enter() {
    hovering = true;
    eventDispatcher("hoveringChange", hovering);
  }

  function leave() {
    hovering = false;
    eventDispatcher("hoveringChange", hovering);
  }

  function click(e: MouseEvent) {
    eventDispatcher("click", e);
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
    e.preventDefault();
    e.stopPropagation();

    window.addEventListener("mousemove", drag)
    window.addEventListener("mouseup", dragStop, { once: true })
  }
  function drag(e: MouseEvent) {
    if (!draggingEnabled) return;
    if (!dragging) return;

    let [x, y] = d3.pointer(e, mainGroup);
    task.x = x;
    task.y = y;
    eventDispatcher("positionChange");
    e.preventDefault();
    e.stopPropagation();
  }
  function dragStop(e: MouseEvent) {
    if (!draggingEnabled) return;

    dragging = false;
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener("mousemove", drag)
  }

  function dblclick(e: MouseEvent) {
    eventDispatcher("dblclick", e);
    e.stopPropagation();
    e.preventDefault();
  }
</script>

<style>
  g:not(.label) {
    cursor: pointer;
  }
  .label {
    font-size: 1.5em;
    fill: gainsboro;
    stroke: gainsboro;

    cursor: default;
  }

  .label > ellipse {
    fill: transparent;
    stroke: transparent;
  }
  g:hover > .taskNode {
    fill: #ffb3a2;
  }
  .taskNode {
    fill: #69b3a2;
  }
  .submitted .taskNode {
    fill: red; /* TODO */
  }
  .solved .taskNode {
    fill: green; /* TODO */
  }
</style>

<g
  bind:this={mainGroup}
  on:mouseenter={enter}
  on:mouseleave={leave}
  on:click={click}
  on:mousedown={dragStart}
  on:dblclick={dblclick}
  class="{status == null ? '' : status.solved ? 'solved' : status.submitted ? 'submitted' : ''} {task.task.type}">
  {#if task.task.type == 'label'}
    {#if draggingEnabled }
      <ellipse rx={ellipse_rx} ry={20} {cx} {cy} />
    {/if}
    <text
      bind:this={text_element}
      x={cx}
      y={cy + 5}
      text-anchor="middle"
      alignment-baseline="middle"
      transform="translate({cx}, {cy}) rotate({task.task.rotationAngle ?? 0}) translate({-cx}, {-cy})">
      {task.task.title == null ? task.id : task.task.title}
    </text>
  {:else}
    <ellipse class="taskNode" rx={ellipse_rx} ry={20} {cx} {cy} />
    <text
      bind:this={text_element}
      x={cx}
      y={cy + 5}
      text-anchor="middle"
      alignment-baseline="middle">
      {task.task.title == null ? task.id : task.task.title}
    </text>
  {/if}
</g>
