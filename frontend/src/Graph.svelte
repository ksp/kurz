<script type="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import *  as tasksLoader from "./task-loader";

  // Svelte automatically fills this with a reference
  let container: HTMLElement;

  onMount(async () => {
    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 30, left: 40 },
      width = container.clientWidth - margin.left - margin.right,
      height = container.clientHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3
      .select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const tasks =  await tasksLoader.loadTasks();
    let nodes = tasks.tasks;
    let edges = tasksLoader.createLinksFromTaskMap(tasks);

    // Initialize the links
    var link = svg
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .style("stroke", "#aaa");

    // Initialize the nodes
    var node = svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 20)
      .style("fill", "#69b3a2");

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
      .force("charge", d3.forceManyBody().strength(-400)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
      .force('x', d3.forceX()) // attracts elements to the zero X coord
      .force('y', d3.forceY()) // attracts elements to the zero Y coord
      .on("tick", ticked)
      .on("end", ticked);

    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
      link
        .attr("x1", function (d) {
          return d.source.x;
        })
        .attr("y1", function (d) {
          return d.source.y;
        })
        .attr("x2", function (d) {
          return d.target.x;
        })
        .attr("y2", function (d) {
          return d.target.y;
        });

      node
        .attr("cx", function (d) {
          return d.x + 6;
        })
        .attr("cy", function (d) {
          return d.y - 6;
        });
    }
  });
</script>

<style>
  div {
    height: 75vh;
    width: 100%;
  }
</style>

<div bind:this={container} />
