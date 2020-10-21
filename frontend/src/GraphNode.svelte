<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { TaskStatus } from "./ksp-task-grabber";
  import type { TaskDescriptor } from "./tasks";

  export let task: TaskDescriptor;
  export let selected: boolean = false;
  export let status: TaskStatus | undefined = undefined;

  let hovering: boolean = false;
  let text_element: SVGTextElement;
  let mainGroup: SVGGElement;

  $: [cx, cy] = task.position ?? [0, 0];

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
    e.stopPropagation();
    eventDispatcher("click", e);
  }

  // automatically size the bubbles to fit the text
  let ellipse_rx = 20;
  function ensureTextFits() {
    const bbox = text_element.getBBox();
    ellipse_rx = bbox.width / 2 + 8;
  }
  // on first run
  onMount(() => {
    ensureTextFits();
  });
  // every time after that
  $: {
    task.title;
    if (text_element) ensureTextFits();
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

  .hidden {
    fill-opacity: 0.5;
    stroke-opacity: 0.5;
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

 
  .submitted .taskNode {
    fill: #da8820; /* TODO */
  }
  g:hover.submitted > .taskNode {
    fill: #ad6000;
  }
  .solved .taskNode {
    fill: #58BF1C; /* TODO */
  }
  g:hover.solved > .taskNode {
    fill: #389700;
  }

  .taskNode {
    fill: #daca20;
  }
  g:hover > .taskNode {
    fill: #ad9e00;
  }

  .selected > ellipse,
  .selected > rect {
    stroke-width: 4px;
    stroke: red;
  }
</style>

<g
  bind:this={mainGroup}
  on:mousedown
  on:mouseenter={enter}
  on:mouseleave={leave}
  on:click={click}
  on:dblclick={dblclick}
  class="{status == null ? '' : status.solved ? 'solved' : status.submitted ? 'submitted' : ''}
    {task.type}
    {selected ? 'selected' : 'notSelected'}
    {task.hidden ?? false ? 'hidden' : ''}">
  {#if task.type == 'label'}
    {#if selected}
      <ellipse rx={ellipse_rx} ry={20} {cx} {cy} />
    {/if}
    <text
      bind:this={text_element}
      x={cx}
      y={cy}
      text-anchor="middle"
      alignment-baseline="middle"
      dominant-baseline="middle"
      transform="translate({cx}, {cy}) rotate({task.rotationAngle ?? 0}) translate({-cx}, {-cy})">
      {task.title == null ? task.id : task.title}
    </text>
  {:else}
    {#if task.type == 'text'}
      <rect
        class="taskNode"
        x={cx - ellipse_rx}
        y={cy - 20}
        height={40}
        width={2 * ellipse_rx}
        rx={3} />
    {:else}
      <ellipse class="taskNode" rx={ellipse_rx} ry={20} {cx} {cy} />
    {/if}
    <text
      bind:this={text_element}
      x={cx}
      y={cy}
      text-anchor="middle"
      dominant-baseline="middle"
      alignment-baseline="middle">
      {task.title == null ? task.id : task.title}
    </text>
  {/if}
</g>
