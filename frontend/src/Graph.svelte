<script type="ts">
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import * as d3 from "d3";
  import { createLinksFromTaskMap } from "./task-loader";
  import type { TasksFile, TaskDescriptor } from "./task-loader";

  export let tasks: TasksFile;
  export let selectedTask: null | string = null;
  export let repulsionForce: number = -600;

  // Svelte automatically fills these with a reference
  let container: HTMLElement;
  let clientHeight: number;
  let clientWidth: number;
  let svgElement: SVGElement;

  $: nodes = tasks.tasks;
  $: edges = createLinksFromTaskMap(tasks);

  const eventDispatcher = createEventDispatcher();

  const nodeClick = (task: TaskDescriptor) => (e: CustomEvent<MouseEvent>) => {
    selectedTask = task.id;
    eventDispatcher("selectTask", task);
  };

  const nodeHover = (task: TaskDescriptor) => (
    hovering: CustomEvent<boolean>
  ) => {
    if (hovering.detail) {
      selectedTask = task.id;
    } else {
      if (selectedTask == task.id) selectedTask = null;
    }
  };

  function runSimulation() {
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
      .force("y", d3.forceY()) // attracts elements to the zero Y coord
      .on("tick", ticked)
      .on("end", ticked);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
      edges = edges;
      nodes = nodes;
    }
  }

  // start simulation and center view on create
  onMount(() => {
    // set center of the SVG at (0,0)
    let svg = d3
      .select(svgElement)
      .attr("viewBox", [
        -clientWidth / 2,
        -clientHeight / 2,
        clientWidth,
        clientHeight,
      ])
      .select("g");

    // setup zoom
    function zoomed(e) {
      svg.attr("transform", e.transform);
    }
    let zoomer = d3.zoom().scaleExtent([0.1, 2]).on("zoom", zoomed);
    d3.select(container).call(zoomer);
  });

  // don't forget to vomit 🤮🤢
  export let runSimulationWeirdHack: boolean = false;
  $: {
    runSimulationWeirdHack;
    runSimulation();
  }
  // now it's safe to stop vomitting 🤮
</script>

<style>
  div {
    height: 100%;
    width: 100%;
  }
</style>

<div bind:this={container} bind:clientHeight bind:clientWidth>
  <svg bind:this={svgElement}>
    <g>
      {#each edges as edge}
        <GraphEdge {edge} />
      {/each}
      {#each nodes as task}
        <GraphNode
          {task}
          on:taskClick
          on:click={nodeClick(task)}
          on:hoveringChange={nodeHover(task)} />
      {/each}
    </g>
  </svg>
</div>
