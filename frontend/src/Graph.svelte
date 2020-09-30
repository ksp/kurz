<script type="ts">
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import * as d3 from "d3";
  import type { TasksFile, TaskDescriptor } from "./task-loader";
  import { createNodesAndEdges } from "./graph-types";
  import { taskForce } from "./task-force";
  import { taskStatuses } from './task-status-cache'
  import { grabTaskStates, isLoggedIn } from "./ksp-task-grabber";
  import type { TaskStatus } from "./ksp-task-grabber"

  export let tasks: TasksFile;
  export let repulsionForce: number = -1000;
  export let nodeDraggingEnabled: boolean = false;

  let hoveredTask: null | string = null;

  // Svelte automatically fills these with a reference
  let container: HTMLElement;
  let clientHeight: number;
  let clientWidth: number;
  let svgElement: SVGElement;

  // this prevents svelte from updating nodes and edges
  // when we update nodes and edges
  let [nodes, edges] = createNodesAndEdges(tasks);
  function hack() {
    [nodes, edges] = createNodesAndEdges(tasks, nodes, edges);
    //runSimulation();
  }
  $: {
    tasks;
    hack();
  }

  const eventDispatcher = createEventDispatcher();

  const nodeClick = (task: TaskDescriptor) => (e: CustomEvent<MouseEvent>) => {
    eventDispatcher("selectTask", task);
  };

  const nodeDoubleClick = (task: TaskDescriptor) => (e: CustomEvent<MouseEvent>) => {
    eventDispatcher("openTask", task);
  };

  const nodeHover = (task: TaskDescriptor) => (
    hovering: CustomEvent<boolean>
  ) => {
    if (hovering.detail) {
      hoveredTask = task.id;
      eventDispatcher("preSelectTask", task);
    } else {
      if (hoveredTask == task.id) hoveredTask = null;
      eventDispatcher("unPreSelectTask", task);
    }
  };

  export function runSimulation() {
    // Let's list the force we wanna apply on the network
    let simulation = d3
      .forceSimulation(nodes) // Force algorithm is applied to data.nodes
      .force(
        "link",
        d3
          .forceLink() // This force provides links between nodes
          .id(function (d) {
            return d.id;
          }) // This provide  the id of a node
          .links(edges) // and this the list of links
      )
      .force("charge", d3.forceManyBody().strength(repulsionForce)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
      .force("x", d3.forceX()) // attracts elements to the zero X coord
      .force("y", d3.forceY().strength(0.5)) // attracts elements to the zero Y coord
      .force("dependencies", taskForce())
      .on("tick", ticked)
      .on("end", ticked);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
      edges = edges;
      nodes = nodes;
    }
  }

  export function getNodePositions(): Map<string, [number, number]> {
    let res = new Map();
    for (let n of nodes) {
      if (n.x != undefined && n.y != undefined) {
        res.set(n.id, [n.x, n.y]);
      }
    } 
    return res
  }


  // start simulation and center view on create
  onMount(() => {
    // set center of the SVG at (0,0)
    let svg = d3.select(svgElement).select("g")

    // setup zoom
    function zoomed(e) {
      svg.attr("transform", e.transform);
    }
    const zoomer = d3.zoom().scaleExtent([0.1, 2])
    zoomer.on("zoom", zoomed);
    d3.select(container).call(zoomer);
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
    z-index: 20
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
      <g transform="translate({clientWidth/2}, {clientHeight/2})">
        {#each edges as edge}
          <GraphEdge {edge} />
        {/each}
        {#each nodes as task}
          <GraphNode
            {task}
            on:taskClick
            on:click={nodeClick(task.task)}
            on:hoveringChange={nodeHover(task.task)}
            on:positionChange={() => { tasks = tasks; }}
            status={$taskStatuses.get(task.id)}
            draggingEnabled={nodeDraggingEnabled}
            on:dblclick={nodeDoubleClick(task.task)} />
        {/each}
      </g>
    </g>
  </svg>
</div>
