
<script lang="ts">
    import { createIndex } from './search';
    import type { IndexedDocument } from './search';
    import { loadTasks } from './tasks';
    import type Fuse from 'fuse.js';
    import { getLocationLink } from './ksp-task-grabber';

    let query: string = "";
    let results = [];

    function updateSearchResults(index: Fuse<IndexedDocument>) {
        results = index.search(query)
    }
</script>

<style>
    :global(body) {
        background-color: #1d1f21;
        color: white;
    }

    .loader {
        height: 90vh;
        width: 100%;
    }

    .loader > h1 {
        margin-right: auto;
        margin-top: auto;
        margin-top: 40vh;
        text-align: center;
    }

    .center {
        text-align: center;
    }

    input {
        font-size: 2em;
        width: 50vw;
    }

    .top1emPad {
        padding-top: 1em;
    }

    .box {
        border-radius: 3px;
        border: 1px solid darkgrey;
        padding-bottom: 1em;

        padding: 1em;
    }

    .boxofboxes {
        display: flex;
        gap: 1em;
        flex-direction: column;

        padding-top: 2em;
        padding-right: 2em;
        padding-left: 2em;
    }

</style>

{#await loadTasks()}
    <div class="loader">
        <h1>Načítávám seznam úloh...</h1>
    </div>
{:then tasks}
    <div>
        {#await createIndex(tasks)}
            <div class="loader">
                <h1>Načítávám obsah všech úloh...</h1>
            </div>
        {:then index }
            <div class="center top1emPad">
                <input placeholder="Co chceš hledat?" type="text" bind:value={query} on:keydown={function() { updateSearchResults(index) } } />
            </div>
            <div class="boxofboxes">
                {#each results as r}
                    <div class="box">
                        <h1><a href="{getLocationLink(r.item.id)}">{r.item.title} ({r.item.id})</a></h1>
                        <h2><a href="{getLocationLink(r.item.id)}">Zadání</a></h2>
                        <p>{@html r.item.assignment.substring(0,300)}</p>
                        <h2><a href="{getLocationLink(r.item.id, true)}">Řešení</a></h2>
                        <p>{@html r.item.solution.substring(0,300)}</p>
                    </div>
                {/each}
            </div>
        {/await}
    </div>
{/await}
