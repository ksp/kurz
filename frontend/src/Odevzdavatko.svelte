<script lang="ts">
    import { isLoggedIn, parseTaskId } from "./ksp-task-grabber";
    import type { TaskSubmitStatus, SubtaskSubmitStatus, TaskStatus } from './ksp-submit-api'
    import * as api from './ksp-submit-api'
    import { taskStatuses, refresh as refreshTaskStatus } from './task-status-cache'
    import * as s from 'svelte'
    import { capitalizeFirstLetter, formatError, nonNull } from "./helpers";

    export let id: string;
    export let cviciste: boolean;
    const taskFromCache: TaskStatus | undefined = $taskStatuses.get(id)
    let task: TaskSubmitStatus
    let subtaskId: string = "1"
    let uploadSubtaskId: string | null | undefined = null
    let expiresInSec: number = 0
    let tick = 1
    let validSubmitSubtasks: SubtaskSubmitStatus[] = []
    let downloading = false
    let generating = false
    let downloadedSubtasks = new Set<string>()

    let error: string | null = null

    $: {
        if (task && task.id == getId()) {
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

        updateTaskStatus()

        downloadedSubtasks.clear()
    }

    $: {
        tick
        task
        expiresInSec = uploadSubtaskId ? calcExpires(uploadSubtaskId) : 0
    }
    window.setInterval(() => { tick++ }, 1000)

    $: {
        tick
        validSubmitSubtasks = task.subtasks.filter(t => calcExpires(t.id) > 0)
    }
    $: {
        if (!validSubmitSubtasks.map(t => t.id).includes(uploadSubtaskId!)) {
            uploadSubtaskId = validSubmitSubtasks.find(t => !isDone(t))?.id ?? validSubmitSubtasks[0]?.id
        }
    }

    function getId() {
        if (cviciste) {
            return "cviciste/" + id
        } else {
            return id
        }
    }

    function updateTaskStatus() {
        if (error != null) {
            error = "....Zkoušíme to znovu"
        }
        api.taskStatus(getId())
           .then(t => {
               error = null
               task = t
               updateCurrentDownloadTask()
           }, err => {
               error = formatError(err)
           })
    }

    function updateCurrentDownloadTask() {
        // update the default task for download
        // prefer not-downloaded not-done.
        const newSubtaskId =
            task.subtasks.find(t => !isDone(t) && !downloadedSubtasks.has(t.id))?.id
        if (newSubtaskId) {
            subtaskId = newSubtaskId
        }
    }

    function updateCurrentUploadTask() {
        // update the default task for upload
        const newSubtaskId =
            validSubmitSubtasks.find(t => !isDone(t))?.id
        if (newSubtaskId) {
            uploadSubtaskId = newSubtaskId
        }
    }

    function calcExpires(subtask: string): number {
        const st = task.subtasks.find(t => t.id == subtask)
        if (!st || !st.input_generated) {
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

    function isDone(subtask: SubtaskSubmitStatus) {
        return subtask.points > subtask.max_points - 0.0001
    }

    function nameSubtaskId(subtaskId: string) {
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
        return map[subtaskId] ?? subtaskId
    }

    function nameSubtask(subtask: SubtaskSubmitStatus) {
        const check = isDone(subtask) ? " ✔️" : ""
        return nameSubtaskId(subtask.id) + check
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
        const [id_, subtaskId_] = [getId(), subtaskId]
        if (!subtaskId_) { return }
        if (calcExpires(subtaskId_) < 20) {
            const x = await api.generateInput(id_, subtaskId_)
            if (id_ != getId()) { return }
            const subtasks = [...task.subtasks]
            subtasks[subtasks.findIndex(s => s.id == x.id)] = x
            task = { ...task, subtasks }
        }

        const subtask = task.subtasks[task.subtasks.findIndex(s => s.id == subtaskId_)]
        if (!subtask || !subtask.download_url) {
            return alert("Chyba: subtask nelze stáhnout")
        }
        // change URL to relative, so a[download] works
        const downloadLink = new URL(subtask.download_url, location.href)
        downloadLink.host = location.host
        downloadLink.protocol = location.protocol
        magicTrickSaveFile(downloadLink.href, subtaskId_ + ".in.txt")
        downloadedSubtasks.add(subtaskId_)
        updateCurrentDownloadTask()

        // if we have a solved task selected, select the downloaded task for upload
        if (!uploadSubtaskId || isDone(task.subtasks.find(t => t.id == uploadSubtaskId)!)) {
            uploadSubtaskId = subtaskId_
        }
    }

    async function upload(file: File) {
        const x = await api.submit(getId(), uploadSubtaskId!, file)
        refreshTaskStatus()
        const subtasks = [...task.subtasks]
        subtasks[subtasks.findIndex(s => s.id == x.id)] = x
        task = { ...task, subtasks }
        alert(x.verdict)
        await s.tick() // wait for update of validSubmitSubtasks
        updateCurrentUploadTask()
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
    {#if error != null}
    
    <p class="errormessage">
        Při načítání odevzdávátka došlo k chybě: <strong>{error}</strong>
        <button on:click={() => updateTaskStatus()}> Zkusit načíst znovu </button>
    </p>
    {#if !cviciste}
        <p>
            Úloha je z běžící série a na odevzdávání je potřeba být v ročníku registrován.
            Případně lze úlohu odevzdávat ve cvičišti - pak nebudeš ve výsledkovce, ale na řešení ani nemusíš být student:
            <button on:click={() => { cviciste = true; updateTaskStatus(); } }>Přepnout se do cvičiště</button>
        </p>
        <p>
            KSPí API zatím neumí odevzdávat teoretické úlohy, je možné, že se úloha nenačetla protože je teoretická. V takovém případě se přepni do odevzdávátka příslušné kategorie.
        </p>
    {/if}

    {:else}
    <div class="download">
        <button class="download"
                on:click={download}
                disabled={downloading || generating}>
            {#if generating}
                Generuji...
            {:else if downloading}
                Stahuji...
            {:else if tick && calcExpires(subtaskId) > 20}
                Stáhnout
            {:else}
                Vygenerovat a stáhnout
            {/if}
        </button>
        <select bind:value={subtaskId}>
            {#each task.subtasks as subtask}
                <option value={subtask.id}>
                    {nameSubtask(subtask)}
                </option>
            {/each}
        </select>
        vstup.
    </div>

    {#if validSubmitSubtasks.length > 0}
    <div class="upload">
        Odevzdat
        <select bind:value={uploadSubtaskId}>
            {#each validSubmitSubtasks as subtask}
                <option value={subtask.id}>
                    {nameSubtask(subtask)}
                </option>
            {/each}
        </select>
        vstup:

        <input type="file" on:change={fileChange}> (nebo přetáhni soubor na stránku)
    </div>
    <div>
        {#if expiresInSec > 60*60*24*30}
            Vstup platí pořád.
        {:else}

            {capitalizeFirstLetter(nameSubtaskId(nonNull(uploadSubtaskId)))}
            vstup expiruje za
            {Math.floor(expiresInSec / 60 / 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}:{Math.floor(expiresInSec / 60 % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}:{Math.floor(expiresInSec % 60).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}s.
        {/if}
    </div>
    {/if} <!-- validSubmitSubtasks.length > 0 -->
    {/if} <!-- error != null -->
</div>
