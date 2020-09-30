<script lang="ts">
    import { getCategories } from "./task-loader";
    import type { TaskDescriptor, TasksFile } from "./task-loader";
    import { getContext } from "svelte";
    import { copyFieldsThatExist } from "./helpers";

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

    function removeCategory(catName: string) {
        return function () {
            editData.categories = editData.categories.filter((t) => t != catName);
        };
    }

    function removeDependency(dep: string) {
        return function () {
            editData.task.requires = editData.task.requires.filter((t) => t != dep);
        };
    }

    function saveAndExit() {
        Object.assign(task, editData.task);
        close();
    }
</script>

<div>
    <div><i>ID:</i> {editData.task.id}, TYPE: {editData.task.type}</div>
    <h1>
        <i>TITLE:</i>
        <span contenteditable="true" bind:textContent={editData.task.title} />
    </h1>
    <div>
        <i>COMMENT:</i>
        <span contenteditable="true" bind:textContent={editData.task.comment} />
    </div>
    {#if editData.task.type == "text"}
        <div><i>HTML obsah:</i></div>
        <div contenteditable="true" bind:textContent={editData.task.htmlContent} />
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
        <button on:click={saveAndExit}>Uložit a zavřít</button>
        <button on:click={close}>Zrušit</button>
    </div>
    <hr />
    <div>
        <h3>Vysvětlivky</h3>
        <i>Kurzívou je psaný text, který nesouvisí s daty. Některý text psaný
            nekurzívou se dá editovat. Změna typu ale třeba není možná, na to je
            potřeba upravit přímo soubor <code>tasks.json</code>.</i>
    </div>
</div>
