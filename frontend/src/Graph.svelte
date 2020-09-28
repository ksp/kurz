<script type="ts">
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import { createEventDispatcher, onMount } from "svelte";
  import * as d3 from "d3";
  import { createLinksFromTaskMap } from "./task-loader";
  import type { TasksFile, TaskDescriptor } from "./task-loader";

  const eventDispatcher = createEventDispatcher();

  export let tasks: TasksFile;
  export let selectedTask: null | string = null;
  export let repulsionForce: number = -600;

  $: nodes = tasks.tasks;
  $: edges = createLinksFromTaskMap(tasks);

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

  // Svelte automatically fills this with a reference
  let container: HTMLElement;

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

  // run on create
  onMount(() => {
    // set the dimensions and margins of the graph
      const width = container.clientWidth;
      const height = container.clientHeight;

    // resize the svg object
    var svg = d3
      .select(container)
      .select("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .select("g");

    function zoomed(e) {
      let { transform } = e;
      svg.attr("transform", transform);
    }

    d3.select(container).call(
      d3
        .zoom()
        .scaleExtent([0.1, 2])
        .on("zoom", zoomed)
    );

    runSimulation();
  });

  // don't forget to vomit 🤮🤢
  export let runSimulationWeirdHack: boolean = true;
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

<div bind:this={container}>
  <svg>
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
