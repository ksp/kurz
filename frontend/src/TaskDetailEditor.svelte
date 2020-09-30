<script lang="ts">
    import { getCategories } from "./task-loader";
    import type { TaskDescriptor, TasksFile } from "./task-loader";
    import { getContext } from "svelte";
    import { onMount } from "svelte";
    import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import App from "./App.svelte";

    const { close } = getContext("simple-modal");

    export let task: TaskDescriptor;
    export let tasks: TasksFile;

    let newCategory: string;

    // copy of task data which we can safely change
    let editData = {
        task: {
            ...task,
            title: task.title == null ? task.id : task.title,
        },
        categories: getCategories(tasks, task.id),
    };

    // setup editor
    let editor;
    onMount(() => {
        ClassicEditor.create(document.querySelector("#editor"))
            .then((e) => {
                editor = e;
            })
            .catch((error) => {
                alert("Editor init error. Open console to see details.");
                console.error(error);
            });
    });

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
        if (editData.task.type == "text")
            editData.task.htmlContent = editor.getData()
        Object.assign(task, editData.task);

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
        <h3>Interní komentář</h3>
        <div contenteditable="true" bind:textContent={editData.task.comment} />
    </div>
    <div style="display: {editData.task.type == "text" ? 'block' : 'none'}">
        <h3>HTML obsah</h3>
        <textarea id="editor">{editData.task.htmlContent}</textarea>
    </div>
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
