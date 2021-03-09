<script type="ts">
  import GraphNode from "./GraphNode.svelte";
  import GraphEdge from "./GraphEdge.svelte";
  import { createEventDispatcher, onMount, tick } from "svelte";
  import * as d3 from "d3";
  import type { TasksFile, TaskDescriptor } from "./tasks";
  import { createEdges } from "./tasks";
  import { taskStatuses } from "./task-status-cache";
  import { isEditableElement, nonNull } from "./helpers";

  export let tasks: TasksFile;
  export let nodeDraggingEnabled: boolean = false;
  export let selectionToolEnabled: boolean = false;
  export let showHiddenEdges: boolean = false;
  export let selection: Set<TaskDescriptor> = new Set();
  export let showCenterMarker: boolean = false;
  export let showHidden: boolean = false;

  let hoveredTask: null | TaskDescriptor = null;

  // Svelte automatically fills these with a reference
  let container: HTMLElement;
  let clientHeight: number = window.innerHeight;
  let clientWidth: number = window.innerWidth;
  let svgElement: SVGElement;
  let innerSvgGroup: SVGElement;
  let selectionRectangle: [[number, number], [number, number]] | null = null;
  let dragInProgress: boolean = false;
  let tooltipTextElement: SVGTextElement;

  $: nodes = tasks.tasks;
  $: edges = createEdges(nodes);

  const eventDispatcher = createEventDispatcher();
  function nodeClick(task: TaskDescriptor) {
    function eventHandler(e: CustomEvent<MouseEvent>) {
      if (selectionToolEnabled) {
        selection.clear();
        selection.add(task);
        selection = selection;
      }
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
        hoveredTask = task;
        if (!selection.has(task) && !dragInProgress) {
          selection.clear();
          selection.add(task);
          selection = selection;
        }
        eventDispatcher("preSelectTask", task);
      } else {
        if (hoveredTask?.id == task.id) hoveredTask = null;
        eventDispatcher("unPreSelectTask", task);
      }
    }
    return eventHandler;
  }

  /**
   * Make the SVG drag&zoomable
   **/
  let currentZoomScale = 1.0
  const positions = tasks.tasks.map(t => t.position ?? [ 0, 0 ])
  const zoomer = d3.zoom().scaleExtent([0.1, 2]).clickDistance(10).translateExtent([[
    Math.min(...positions.map(p => p[0])), Math.min(...positions.map(p => p[1])) - 1000
  ], [
    Math.max(...positions.map(p => p[0])), Math.max(...positions.map(p => p[1])) + 1000
  ]]);
  function setupZoom() {
    function zoomed(e: any) {
      let svg = d3.select(svgElement).select("g");
      currentZoomScale = e.transform.k
      svg.attr("transform", e.transform);
    }
    zoomer.on("zoom", zoomed);
    const selection = d3.select(container) as any
    selection.call(zoomer);
  }

  function keydown(key: KeyboardEvent) {
    if (isEditableElement(document.activeElement)) {
      // another element has focus - ignore our shortcuts
      return
    }

    const selection = d3.select(container) as any
    const c = 60 / currentZoomScale

    if (key.key == "ArrowLeft" || key.key == "a") {
      zoomer.translateBy(selection, c, 0)
    }
    else if (key.key == "ArrowRight" || key.key == "d") {
      zoomer.translateBy(selection, -c, 0)
    }
    else if (key.key == "ArrowUp" || key.key == "w") {
      zoomer.translateBy(selection, 0, c)
    }
    else if (key.key == "ArrowDown" || key.key == "s") {
      zoomer.translateBy(selection, 0, -c)
    } else if (key.key == "+") {
      zoomer.scaleBy(selection, 1.2)
    } else if (key.key == "-") {
      zoomer.scaleBy(selection, 1/1.2)
    }
  }

  function containerClickHandler(e: MouseEvent) {
    eventDispatcher("closeTask");
  }

  function groupSelectionHandler(e: MouseEvent) {
    // not enabled?
    if (!selectionToolEnabled) return;

    // not a right button?
    if (e.button != 2) return;

    // setup drag start
    const startPos = d3.pointer(e, innerSvgGroup);

    // prevent default
    e.preventDefault();
    e.stopPropagation();

    function updateSelection() {
      selection.clear();
      tasks.tasks.forEach((t) => {
        if (
          selectionRectangle![0][0] < (t.position ?? [0, 0])[0] &&
          (t.position ?? [0, 0])[0] < selectionRectangle![1][0] &&
          selectionRectangle![0][1] < (t.position ?? [0, 0])[1] &&
          (t.position ?? [0, 0])[1] < selectionRectangle![1][1]
        )
          selection.add(t);
      });
      selection = selection;
    }

    // setup mouse move
    function mouseMove(e: MouseEvent) {
      const np = d3.pointer(e, innerSvgGroup);
      selectionRectangle = [
        [Math.min(np[0], startPos[0]), Math.min(np[1], startPos[1])],
        [Math.max(np[0], startPos[0]), Math.max(np[1], startPos[1])],
      ];
      updateSelection();
    }
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", mouseUp, { once: true });

    // setup mouse down
    function mouseUp(e: MouseEvent) {
      // not a right button?
      if (e.button != 2) return;

      e.preventDefault();
      e.stopPropagation();

      // save selection
      const np = d3.pointer(e, innerSvgGroup);
      selectionRectangle = [
        [Math.min(np[0], startPos[0]), Math.min(np[1], startPos[1])],
        [Math.max(np[0], startPos[0]), Math.max(np[1], startPos[1])],
      ];
      updateSelection();
      selectionRectangle = null;

      // cleanup listeners
      window.removeEventListener("mousemove", mouseMove);
    }
  }

  // dragging
  function dragStart(e: MouseEvent) {
    if (!nodeDraggingEnabled) return;

    // is the left button pressed?
    if (e.button != 0) return;

    dragInProgress = true;
    e.preventDefault();
    e.stopPropagation();

    let startPos = d3.pointer(e, innerSvgGroup);

    function drag(e: MouseEvent) {
      if (!nodeDraggingEnabled) return;

      const currPos = d3.pointer(e, innerSvgGroup);
      const [dx, dy] = [currPos[0] - startPos[0], currPos[1] - startPos[1]];
      for (const [t, _] of selection.entries()) {
        t.position = [
          (t.position ?? [0, 0])[0] + dx,
          (t.position ?? [0, 0])[1] + dy,
        ];
      }
      tasks = tasks;
      startPos = currPos;

      e.preventDefault();
      e.stopPropagation();
    }

    function dragStop(e: MouseEvent) {
      if (!nodeDraggingEnabled) return;

      dragInProgress = false;
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener("mousemove", drag);
    }

    window.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", dragStop, { once: true });
  }

  export function getCurrentSelection(): Set<TaskDescriptor> {
    return selection;
  }

  onMount(() => {
    setupZoom();
  });


  let tooltipMaxPoints: number | null = null;
  let tooltipCurrPoints: number | null = null;
  $: tooltipTextPos = hoveredTask != null ? [(hoveredTask.position ?? [0,0])[0], (hoveredTask.position ?? [0,0])[1] + 40] : [0,0];
  let tooltipBoxWidth = 0;
  async function resizeTooltipBox() {
    await tick();
    if (tooltipTextElement == null) return;
    const bbox = tooltipTextElement.getBBox()
    tooltipBoxWidth = bbox.width + 10 + 10;
  }
  $: {
    tooltipMaxPoints = null;
    tooltipCurrPoints = null;
    if (hoveredTask != null) {
      const status = $taskStatuses.get((hoveredTask as any).taskReference);
      if (status) {
        tooltipMaxPoints = status.maxPoints;
        tooltipCurrPoints = status.points;
      }
      else if (hoveredTask.type == 'open-data' || hoveredTask.type == 'custom-open-data') {
        tooltipMaxPoints = hoveredTask.points
      }
      resizeTooltipBox();
    }
  };
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

  :global(#footer) {
    z-index: 20;
  }

  .selectionRectangle {
    fill: transparent;
    stroke-dasharray: 5, 5;
    stroke: gainsboro;
  }

  .tooltip rect {
    stroke: #daca20;
    stroke-width: 2px;
    fill: #000000bb;
  }

  .tooltip text {
    /* stroke: white;*/
    fill: white;
  }
</style>

<svelte:window on:keydown={keydown} />

<div
  bind:this={container}
  bind:clientHeight
  bind:clientWidth
  on:click={containerClickHandler}
  on:mousedown={groupSelectionHandler}
  on:contextmenu={(e) => {
    if (selectionToolEnabled) {
      e.preventDefault();
      return false;
    }
  }}>
  <!-- The viewBox must be set to 0,0 origin, otherwise the drag&zoom of the graph breaks -->
  <svg bind:this={svgElement} viewBox="{0},{0},{clientWidth},{clientHeight}">
    <g>
      <!-- The translation assures that [0,0] is just bellow current KSP header in the horizontal center of the page -->
      <g
        bind:this={innerSvgGroup}
        transform="translate({clientWidth / 2}, 210)">
        {#if selectionRectangle != null}
          <rect
            class="selectionRectangle"
            x={selectionRectangle[0][0]}
            y={selectionRectangle[0][1]}
            width={selectionRectangle[1][0] - selectionRectangle[0][0]}
            height={selectionRectangle[1][1] - selectionRectangle[0][1]} />
        {/if}
        {#if showCenterMarker}
          <line
            x1="10000"
            y1="0"
            x2="-10000"
            y2="0"
            stroke="gray"
            stroke-width="1px"
            stroke-dasharray="15,15" />
          <line
            x1="0"
            y1="10000"
            x2="0"
            y2="0"
            stroke="gray"
            stroke-width="1px"
            stroke-dasharray="15,15" />
        {/if}
        {#each edges as edge}
          {#if showHidden || !(edge?.dependee?.hidden || edge?.dependency?.hidden)}
            <GraphEdge {edge} showLabelEdge={showHiddenEdges} />
          {/if}
        {/each}
        {#each nodes as task}
          {#if showHidden || !(task.hidden ?? false) }
            <GraphNode
            {task}
            on:mousedown={dragStart}
            selected={selectionToolEnabled && selection.has(task)}
            on:taskClick
            on:click={nodeClick(task)}
            on:hoveringChange={nodeHover(task)}
            status={$taskStatuses.get(nonNull(task.taskReference))}
            on:dblclick={nodeDoubleClick(task)} />
          {/if}
        {/each}
        {#if hoveredTask != null && ['open-data', 'custom-open-data'].includes(hoveredTask.type) }
        <g class="tooltip">
          <rect
            x={tooltipTextPos[0]}
            y={tooltipTextPos[1] - 15}
            width={tooltipBoxWidth}
            height={30}
            rx="3">
          </rect>
          <text
              bind:this={tooltipTextElement}
              x={tooltipTextPos[0] + tooltipBoxWidth / 2}
              y={tooltipTextPos[1]}
              text-anchor="middle"
              alignment-baseline="middle"
              dominant-baseline="middle">
              {hoveredTask.taskReference} | {tooltipCurrPoints ?? '?'} bod{ "ů yyy"[tooltipCurrPoints ?? 0] ?? "ů" } z {tooltipMaxPoints ?? '?'}
            </text>
        </g>
      {/if}
      </g>
    </g>
  </svg>
</div>
