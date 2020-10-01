<script type="ts">
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import * as d3 from "d3";
  import type { TasksFile, TaskDescriptor } from "./tasks";
  import { createEdges } from "./tasks";
  import { taskStatuses } from "./task-status-cache";

  export let tasks: TasksFile;
  export let nodeDraggingEnabled: boolean = false;
  export let showHiddenEdges: boolean = false;

  let hoveredTask: null | string = null;

  // Svelte automatically fills these with a reference
  let container: HTMLElement;
  let clientHeight: number;
  let clientWidth: number;
  let svgElement: SVGElement;

  $: nodes = tasks.tasks;
  $: edges = createEdges(nodes);

  const eventDispatcher = createEventDispatcher();
  function nodeClick(task: TaskDescriptor) {
    function eventHandler(e: CustomEvent<MouseEvent>) {
      eventDispatcher("selectTask", task);
    }
    return eventHandler;
  }
  function nodeDoubleClick(task: TaskDescriptor) {
    function eventHandler(e: CustomEvent<MouseEvent>) {
      eventDispatcher("openTask", task);
    }
    return eventHandler;
  }
  function nodeHover(task: TaskDescriptor) {
    function eventHandler(hovering: CustomEvent<boolean>) {
      if (hovering.detail) {
        hoveredTask = task.id;
        eventDispatcher("preSelectTask", task);
      } else {
        if (hoveredTask == task.id) hoveredTask = null;
        eventDispatcher("unPreSelectTask", task);
      }
    }
    return eventHandler;
  }

  /**
   * Make the SVG drag&zoomable
   **/
  function setupZoom() {
    function zoomed(e) {
      let svg = d3.select(svgElement).select("g");
      svg.attr("transform", e.transform);
    }
    const zoomer = d3.zoom().scaleExtent([0.1, 2]).clickDistance(10);
    zoomer.on("zoom", zoomed);
    d3.select(container).call(zoomer);
  }

  onMount(() => {
    setupZoom();
  });
</script>

<style>
  div {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0px;
    left: 0px;
  }
  :global(#header) {
    z-index: 20;
  }
  :global(#wrapper) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  :global(#page) {
    flex-grow: 1;
  }
</style>

<div bind:this={container} bind:clientHeight bind:clientWidth>
  <svg bind:this={svgElement} viewBox="{0},{0},{clientWidth},{clientHeight}">
    <g>
      <g transform="translate({clientWidth / 2}, {clientHeight / 2})">
        {#each edges as edge}
          <GraphEdge {edge} showLabelEdge={showHiddenEdges} />
        {/each}
        {#each nodes as task}
          <GraphNode
            {task}
            on:taskClick
            on:click={nodeClick(task)}
            on:hoveringChange={nodeHover(task)}
            on:positionChange={() => {
              tasks = tasks;
            }}
            status={$taskStatuses.get(task.id)}
            draggingEnabled={nodeDraggingEnabled}
            on:dblclick={nodeDoubleClick(task)} />
        {/each}
      </g>
    </g>
  </svg>
</div>
