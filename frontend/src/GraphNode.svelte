<script lang="ts">
  import * as d3 from "d3";

  import { createEventDispatcher, onMount } from "svelte";
  import type { TaskStatus } from "./ksp-task-grabber";
  import type { TaskDescriptor } from "./tasks";

  export let task: TaskDescriptor;
  export let selected: bool = false;
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
    if (text_element)
      ensureTextFits();
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

  .selected > ellipse {
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
  class="{status == null ? '' : status.solved ? 'solved' : status.submitted ? 'submitted' : ''} {task.type} {selected ? 'selected' : 'notSelected'}">
  {#if task.type == 'label'}
    {#if selected }
      <ellipse rx={ellipse_rx} ry={20} {cx} {cy} />
    {/if}
    <text
      bind:this={text_element}
      x={cx}
      y={cy + 5}
      text-anchor="middle"
      alignment-baseline="middle"
      transform="translate({cx}, {cy}) rotate({task.rotationAngle ?? 0}) translate({-cx}, {-cy})">
      {task.title == null ? task.id : task.title}
    </text>
  {:else}
    <ellipse class="taskNode" rx={ellipse_rx} ry={20} {cx} {cy} />
    <text
      bind:this={text_element}
      x={cx}
      y={cy + 5}
      text-anchor="middle"
      alignment-baseline="middle">
      {task.title == null ? task.id : task.title}
    </text>
  {/if}
</g>
