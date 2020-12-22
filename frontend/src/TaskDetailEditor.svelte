<script lang="ts">
    import { getCategories } from "./tasks";
    import type { TaskDescriptor, TasksFile } from "./tasks";
    import { getContext } from "svelte";
    import { onMount } from "svelte";
    import CkEditor from "./CkEditorWrapper.svelte";
    import CkEditorWrapper from "./CkEditorWrapper.svelte";
    import { sync as ckeditorSync } from './ckeditorSynchronizer'

    const { close } = getContext("simple-modal");

    export let task: TaskDescriptor;
    export let tasks: TasksFile;

    let newCategory: string;

    // copy of task data which we can safely change
    let editData = {
        task: {
            ...task,
            title: task.title == null ? task.id : task.title,
            originalSource: task.originalSource ?? { url: "", name: "", },
        },
        categories: getCategories(tasks, task.id),
    };

    $: {
        // add missing required properties
        if (editData.task.type == "custom-open-data") {
            if (!editData.task.htmlAssignment) {
                editData.task.htmlAssignment = "FIXME: napsat zadání"
            }
            if (editData.task.htmlSolution == null) {
                editData.task.htmlSolution = undefined
            }
            if (editData.task.points == null) {
                editData.task.points = 10
            }
        }
        if (editData.task.type == "text") {
            if (!editData.task.htmlContent) {
                editData.task.htmlContent = "FIXME: napsat ten text"
            }
        }
    }

    function removeCategory(catName: string) {
        return function () {
            editData.categories = editData.categories.filter(
                (t) => t != catName
            );
        };
    }

    function removeDependency(dep: string) {
        return function () {
            editData.task.requires = editData.task.requires.filter(
                (t) => t != dep
            );
        };
    }

    function saveAndExit() {
        ckeditorSync()

        Object.assign(task, editData.task);
        const taskA = task as any
        if (
            taskA.originalSource &&
            taskA.originalSource.url == "" &&
            taskA.originalSource.name == ""
        ) {
            taskA.originalSource = undefined;
        }
        if (task.type != "custom-open-data") {
            delete taskA.htmlAssignment
            delete taskA.htmlSolution
        }
        if (task.type == "text") {
            delete taskA.points
            delete taskA.taskReference
        } else {
            delete taskA.htmlContent
        }
        if (task.type == "label") {
            delete taskA.points
            delete taskA.taskReference
        } else {
            delete taskA.rotationAngle
        }

        // kategorie musíme první odevšad odstranit
        for (const t of Object.keys(tasks.clusters)) {
            tasks.clusters[t] = tasks.clusters[t].filter(
                (id) => id != editData.task.id
            );
        }
        // a pak všude přidat
        for (const t of editData.categories) {
            tasks.clusters[t] = [
                ...(tasks.clusters[t] ?? []),
                editData.task.id,
            ];
            tasks.clusters[t].sort(); // make git happy
        }

        // a nakonec zavřít dialog
        close();
    }
</script>

<style>
    .fakeInput {
        border: 1px solid lightgray;
        padding: 0.5em;
        display: inline-block;
        margin: 0.5em;
    }
</style>

<div>
    <div>
        <span><i>ID:</i> {editData.task.id},</span>
        <span>
            TYPE: <select
                bind:value={editData.task.type}
                on:blur={() => {
                    editData = editData;
                }}>
                <option value="open-data">open-data</option>
                <option value="custom-open-data">custom-open-data</option>
                <option value="text">text</option>
                <option value="label">label</option>
            </select>
        </span>
    </div>
    <h1>
        <i>TITLE:</i>
        <span contenteditable="true" bind:textContent={editData.task.title} />
    </h1>
    <div>
        <div style="display: inline-block">Interní komentář:</div>
        <div
            class="fakeInput"
            contenteditable="true"
            bind:textContent={editData.task.comment} />
    </div>
    {#if ['open-data', 'custom-open-data'].includes(editData.task.type) }
        <label>
            Task reference: <input type="text" bind:value={editData.task.taskReference} />
        </label>
    {/if}
    <label>
        Převzato z{'zsZS'.includes(editData.task.originalSource.name[0]) ? 'e' : ''}
        <input
            type="text"
            bind:value={editData.task.originalSource.name}
            placeholder="např. kuchařky" />
    </label>
    <label>
        Odkaz na původní zdroj: <input type="url" bind:value={editData.task.originalSource.url} placeholder="absolutní URL mimo KSPí web, jinak relativní" />
    </label>
    {#if editData.task.type == 'text'}
    <div>
        <h3>HTML obsah</h3>
        <CkEditorWrapper bind:html={editData.task.htmlContent} />
    </div>
    {/if}
    {#if editData.task.type == 'custom-open-data'}
    <div>
        <h3>Zadání</h3>
        <label>Počet bodů: <input type=number bind:value={editData.task.points} /></label>
        <CkEditorWrapper bind:html={editData.task.htmlAssignment} />

        <label>Má řešení:
            <input type="checkbox"
                   checked={editData.task.htmlSolution != null}
                   on:input={ev => editData.task.htmlSolution = ev.currentTarget.checked ? "FIXME: sem dopiš vzorové řešení" : undefined} />
        </label>

        {#if editData.task.htmlSolution != null}
            <CkEditorWrapper bind:html={editData.task.htmlSolution} />
        {/if}
    </div>
    {/if}
    <hr />
    <div>
        <h3>Kategorie</h3>
        <ul>
            {#each editData.categories as cat}
                <li>
                    {cat}<button style="margin-left: 1em;" on:click={removeCategory(cat)}>x</button>
                </li>
            {/each}
        </ul>
        <div>
            <input
                type="text"
                bind:value={newCategory}
                placeholder="Nová kategorie" />
            <button
                on:click={() => {
                    editData.categories = [...editData.categories, newCategory];
                }}>Přidat</button>
        </div>
    </div>
    <hr />
    <div>
        <h3>Závislosti</h3>
        <ul>
            {#each editData.task.requires as req}
                <li>
                    {req}<button style="margin-left: 1em;" on:click={removeDependency(req)}>x</button>
                </li>
            {/each}
        </ul>
        <span>
            <i>Jestli chceš vyrobit novou závislost, vyrob novou hranu v grafu.
                Tady to nejde.</i>
        </span>
    </div>
    <hr />
    <div>
        <button on:click={saveAndExit}>Aplikovat</button>
        <button on:click={close}>Zrušit změny</button>
    </div>
    <hr />
    <div>
        <h3>Vysvětlivky</h3>
        <i>Kurzívou je psaný text, který nesouvisí s daty. Některý text psaný
            nekurzívou se dá editovat. Jakékoliv velké operace je ale vhodné
            dělat přímo se souborem <code>tasks.json</code></i>
    </div>
</div>
