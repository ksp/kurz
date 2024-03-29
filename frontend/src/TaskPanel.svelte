<script lang="ts">
    import type { TasksFile, TaskDescriptor } from "./tasks";
    import TaskDisplay from "./TaskDisplay.svelte";

    export let tasks: TasksFile;
    let selectedTask: TaskDescriptor | null = null;
    let nextTasks: TaskDescriptor[] = [];
    export let selectedTaskId: string | null = null;

    let heightClass: "closed" | "full" = "closed";

    let lastSelectedTaskId: string | null = null;

    $: {
        if (selectedTaskId && lastSelectedTaskId != selectedTaskId) {
            heightClass = "full";
            selectedTask =
                tasks.tasks.find((t) => t.id == selectedTaskId) ?? null;
            nextTasks = tasks.tasks.filter(
                (t) =>
                    t.requires.includes(selectedTaskId!) &&
                    !t.hidden &&
                    t.type != "label"
            );
        } else {
            heightClass = "closed";
        }
        lastSelectedTaskId = selectedTaskId;
    }

    function close() {
        heightClass = "closed";
        location.hash = "";
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            close();
        }
    }
</script>

<style>
    .panel {
        position: relative;
        width: calc(min(100%, 100vw - 20px));
        overflow: hidden;
        padding: 16px 100px 16px 100px;
        border: 1px solid #444444;
        border-bottom: 2px dashed #444444;
        background-color: #111111;
        box-sizing: border-box;
        z-index: 120;
        border-radius: 30px;
        text-align: left;
    }
    @media only screen and (max-width: 600px) {
        .panel {
            padding: 0 10px 10px 10px;
        }
    }
    /* Used when the panel is explicitly closed  */
    .panel.closed {
        display: none;
    }

    .panel.full {
        min-height: 420px;
        border-bottom: 2px solid #444444;
    }
    .closeButton {
        position: absolute;
        right: 0;
        top: 0;
        margin-top: 0.3em;
        margin-right: 0.3em;
        cursor: pointer;
        color: #ddd;
        border-radius: 1.5em;
        border: 1.5px solid #666666;
        background: transparent;
        font-size: 1.5em;
        line-height: 0.7em;
        padding: 0.4em 0.4em;
    }
    .closeButton::before {
        content: "✖";
    }
    .panel.full .closeButton {
        display: inherit;
    }
    .splitter {
        margin: 0px 8px;
        color: #777777;
    }

    hr {
        margin-top: 0.2em;
    }
    .vertical1EMGap {
        margin: 1em 0 0 0 ;
        height: 0;
    }
    .originalSource {
        text-align: right;
    }

</style>

<svelte:window on:keydown={handleKeydown} />

<div class="panel {heightClass}"
     on:click={() => location.hash = `#task/${selectedTask?.id}`}>
    <TaskDisplay task={selectedTask} />
    <button type=button class="closeButton" on:click|stopPropagation={close}></button>

    <div class="vertical1EMGap" />
    {#if selectedTask && selectedTask.originalSource }
        <div class="originalSource">
            <i><a href={selectedTask.originalSource.url}>Převzato z{"zsZS".includes(selectedTask.originalSource.name[0]) ? "e" : ""} {selectedTask.originalSource.name}</a></i>
        </div>
    {/if}
    <hr>

    <div class="footer">
        <a href="/kurz" on:click|stopPropagation|preventDefault={close}>Zavřít</a>
        {#if nextTasks.length}
            <span class="splitter">|</span> Pokračování:
            {#each nextTasks as nextT}
                {#if nextTasks[0] != nextT} <span class="splitter">|</span> {/if}
                <a href="#task/{nextT.id}">{nextT.title}</a>
            {/each}
        {/if}
    </div>
</div>
