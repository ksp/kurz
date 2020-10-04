<script lang="ts">
    import { isLoggedIn, parseTaskId } from "./ksp-task-grabber";
    import type { TaskStatus } from "./ksp-task-grabber";
    import type { TaskSubmitStatus, SubtaskSubmitStatus } from './ksp-submit-api'
    import * as api from './ksp-submit-api'
    import { taskStatuses, refresh as refreshTaskStatus } from './task-status-cache'

    export let id: string;
    const taskFromCache: TaskStatus | undefined = $taskStatuses.get(id)
    let task: TaskSubmitStatus
    let subtaskId: string | null | undefined = null
    let uploadSubtaskId: string | null | undefined = null
    let expiresInSec: number = 0
    let tick = 0
    let validSubmitSubtasks: SubtaskSubmitStatus[] = []
    let downloading = false
    let generating = false

    $: {
        if (task && task.id == "cviciste/" + id) {
            break $
        }

        task = {
            // fill with guesses to prevent flashing
            id,
            name: "",
            points: taskFromCache?.points ?? 0,
            max_points: taskFromCache?.maxPoints ?? 1,
            subtasks: [
                { id: "1", input_generated: false, max_points: 1, points: 0 }
            ]
        }
        subtaskId = "1"

        api.taskStatus(id)
           .then(t => {
               task = t
           })
    }

    $: {
        if (!task.subtasks.find(t => t.id == subtaskId))
            subtaskId = task.subtasks.find(t => t.points < t.max_points - 0.001)?.id
    }

    $: {
        tick
        task
        expiresInSec = subtaskId ? calcExpires(subtaskId) : 0
    }
    window.setInterval(() => { tick++ }, 1000)

    $: {
        tick
        validSubmitSubtasks = task.subtasks.filter(t => calcExpires(t.id) > 0)
    }
    $: {
        if (!validSubmitSubtasks.map(t => t.id).includes(uploadSubtaskId!)) {
            uploadSubtaskId = validSubmitSubtasks[0]?.id
        }
    }

    function calcExpires(subtask: string): number {
        const st = task.subtasks.find(t => t.id == subtask)!
        if (!st.input_generated) {
            return 0
        }
        const validUntil = new Date(st.input_valid_until!).valueOf()
        const now = Date.now()
        if (validUntil < now) {
            return 0
        } else {
            return (validUntil - now) / 1000
        }
    }

    function nameSubtask(id: string) {
        const map: any = {
            "1": "první",
            "2": "druhý",
            "3": "třetí",
            "4": "čtvrtý",
            "5": "pátý",
            "6": "šestý",
            "7": "sedmý",
            "8": "osmý",
            "9": "devátý",
            "10": "desátý"
        }
        return map[id] ?? id
    }

    function magicTrickSaveBlob(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob)
        magicTrickSaveFile(url, fileName)
        window.URL.revokeObjectURL(url);
    }
    function magicTrickSaveFile(url: string, fileName: string) {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = fileName;
        a.click();
        a.remove()
    }

    async function download() {
        // copy to prevent races
        const [id_, subtaskId_] = [id, subtaskId]
        if (!subtaskId_) { return }
        if (expiresInSec < 20) {
            const x = await api.generateInput(id_, subtaskId_)
            if (id_ != id) { return }
            const subtasks = [...task.subtasks]
            subtasks[subtasks.findIndex(s => s.id == x.id)] = x
            task = { ...task, subtasks }
        }
        // It's probably better to download the input using the "old" method
        // TODO: specify that as an API

        const parsedId = parseTaskId(id_)
        magicTrickSaveFile(`/cviciste/?in=1:sub=${subtaskId}:task=${id_}:year=${parsedId!.rocnik}`, subtaskId_ + ".in.txt")

        // const blob = await api.getInput(id_, subtaskId_)
        // magicTrickSaveBlob(blob, subtaskId_ + ".in.txt")
    }

    async function upload(file: File) {
        const x = await api.submit(id, uploadSubtaskId!, file)
        refreshTaskStatus([id])
        alert(x.verdict)
    }

    function fileChange(ev: Event) {
        const file = (ev.target as HTMLInputElement).files![0]
        upload(file)
    }

    function drop(ev: DragEvent) {
        ev.preventDefault()
        const files = ev.dataTransfer?.files ?? []
        if (files.length > 1) {
            alert("Drag & Drop funguje, ale musíš jenom jeden soubor")
        }
        if (files.length > 0) {
            upload(files[0])
        }
    }
    function dragOver(ev: DragEvent) {
        ev.preventDefault()
    }
</script>

<style>
    
</style>

<svelte:body on:drop={drop} on:dragover={dragOver} />

<div class="odevzdavatko">
    <div class="download">
        <button class="download"
                on:click={download}
                disabled={subtaskId == null || downloading || generating}>
            {#if generating}
                Generuji...
            {:else if downloading}
                Stahuji...
            {:else if expiresInSec > 20}
                Stáhnout
            {:else}
                Vygenerovat a stáhnout
            {/if}
        </button>
        <select bind:value={subtaskId}>
            <option value={null}></option>
            {#each task.subtasks as subtask}
                <option value={subtask.id}>
                    {nameSubtask(subtask.id)}
                    {#if subtask.points > subtask.max_points - 0.0001}
                        <span title="Splněno">✔️</span>
                    {/if}
                </option>
            {/each}
        </select>
        vstup.
    </div>

    {#if validSubmitSubtasks.length > 0}
    <div class="upload">
        Odevzdat
        <select value={uploadSubtaskId}>
            {#each validSubmitSubtasks as subtask}
                <option value={subtask.id}>
                    {nameSubtask(subtask.id)}
                </option>
            {/each}
        </select>
        vstup:

        <input type="file" on:change={fileChange}> (nebo přetáhni soubor na stránku)
    </div>
    <div>
        {#if expiresInSec > 60*60*24*30}
            Vstup neexpiruje.
        {:else}
            Vstup expiruje za {Math.floor(expiresInSec / 60 / 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}:{Math.floor(expiresInSec / 60 % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}:{Math.floor(expiresInSec % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}s.
        {/if}
    </div>
    {/if}
</div>
