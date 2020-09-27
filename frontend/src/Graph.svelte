<script type="ts">
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { createLinksFromTaskMap } from "./task-loader";
  import type { TasksFile } from "./task-loader";

  export let tasks: TasksFile;
  let nodes = tasks.tasks;
  let edges = createLinksFromTaskMap(tasks);

  // Svelte automatically fills this with a reference
  let container: HTMLElement;

  onMount(async () => {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 40 },
      width = container.clientWidth - margin.left - margin.right,
      height = container.clientHeight - margin.top - margin.bottom;

    // resize the svg object
    var svg = d3
      .select(container)
      .select("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .select("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Let's list the force we wanna apply on the network
    var simulation = d3
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
      .force("charge", d3.forceManyBody().strength(-500)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
      .force("x", d3.forceX()) // attracts elements to the zero X coord
      .force("y", d3.forceY()) // attracts elements to the zero Y coord
      .on("tick", ticked)
      .on("end", ticked);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
      edges = edges;
      nodes = nodes;
    }
  });
</script>

<style>
  div {
    height: 75vh;
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
        <GraphNode {task} />
      {/each}
    </g>
  </svg>
</div>
