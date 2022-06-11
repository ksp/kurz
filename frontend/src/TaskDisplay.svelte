<script type="ts">
    import { grabAssignment, grabSolution, isLoggedIn } from "./ksp-task-grabber";
    import type { TaskAssignmentData } from "./ksp-task-grabber";
    import { nonNull } from './helpers'
    import { taskStatuses } from "./task-status-cache";
    import type { TaskDescriptor } from './tasks'
    import Odevzdavatko from "./Odevzdavatko.svelte";
    import SolutionCaptcha from "./SolutionCaptcha.svelte";
    import type { TaskStatus } from "./ksp-submit-api";

    export let task: TaskDescriptor | null | undefined

    let wantsSolution = false
    export let showSolution: boolean = false
    $: {
        task
        showSolution = false
        wantsSolution = false
    }

    let referenceId: string | undefined
    $: {
        if (task != null) {
            const r = task.taskReference
            if (referenceId != r)
                referenceId = r
        }
    }
    let status: TaskStatus | undefined
    $: if (task) status = $taskStatuses.get(referenceId!)

    let loginUrl: string = null!
    function updateLoginUrl() {
        loginUrl = `/z/auth/login.cgi?redirect=${encodeURIComponent(location.href)}`
    }
    updateLoginUrl()
    window.addEventListener("onhashchange", updateLoginUrl)

    function maybeShowSolution() {
        if (status && status.points > status.maxPoints - 0.01) {
            showSolution = true
        } else {
            wantsSolution = true
        }
    }

    function getAssignment(task: TaskDescriptor): Promise<TaskAssignmentData> {
        if ("open-data" == task.type) {
            return grabAssignment(task.taskReference)
        } else if ("custom-open-data" == task.type) {
            return Promise.resolve({
                description: task.htmlAssignment,
                id: task.taskReference,
                name: task.title,
                points: task.points,
                hasSolution: task.htmlSolution != null
            })
        } else throw new Error("Invalid task type")
    }

</script>
<style>
    div {
        text-align: justify;
    }
    .header {
        display: flex;
        flex-direction: row;
    }
    @media only screen and (max-width: 600px) {
        .header {
            margin-right: 40px;
        }
    }
    .header div {
        flex-grow: 1;
    }
    .header .status {
        text-align: right;
        font-style: italic;
    }
    /* Workaround: ksp.css is reseting the default style for ol and ul tags */
    div :global(ul), div :global(ol) {
        list-style: initial;
        margin-left: 2em;
    }
</style>

<div>
    {#if task != null}
    {#if task.type == "text"}
        <div class="header">
            <div class="title"><h3>{task.title}</h3></div>
        </div>
        {@html task.htmlContent || "Toto je prázdný textový node 😢"}
    {:else if ["open-data", "custom-open-data"].includes(task.type)}

    {#await getAssignment(task)}
        Načítám úlohu
    {:then assignment}
        <div class="header">
            <div class="title"><h3>{assignment.name}</h3></div>

            <div class="status">
                <p>
                    {referenceId} | {assignment.points} bodů
                    {#if status && status.submitted}
                        {#if status.solved}
                        | Vyřešeno 🥳
                        {:else}
                        | odevzdáno za {status.points} bod{ "ů yyy"[status.points] ?? "ů" }
                        {/if}
                    {/if}
                </p>
            </div>
        </div>
        {@html assignment.description}

        <hr class="clearfloat" />
        {#if isLoggedIn()}
            <Odevzdavatko id={nonNull(referenceId)} cviciste={!task.isCurrent} />
        {:else}
            <p class="zs-warning">Pro odevzdávání je potřeba se <a href={loginUrl}>přihlásit</a>.</p>
        {/if}

        <hr class="clearfloat" />

        <div class="solution">
            {#if task.isCurrent}
                Úloha je stále soutežní a tak k ní řešení přirozeně není veřejné :)
            {:else if !assignment.hasSolution}
                K úloze není zveřejněné vzorové řešení, budeš ho muset vymyslet sám.
                Rádi Ti ale s řešením poradíme na <a href="https://discord.gg/AvXdx2X">našem Discordu</a> a nebo na <a href="mailto:zdrojaky@ksp.mff.cuni.cz">zdrojaky@ksp.mff.cuni.cz</a>.
            {:else if showSolution}

                <h4>Řešení</h4>
                {#await grabSolution(nonNull(referenceId))}
                    Načítám...
                {:then solution}
                    {@html solution.description}
                {:catch err}
                    <p>Řešení se nepodařilo načíst. Je nám líto. Zkus stránku refreshnout a zkusit to znovu. Pokud si myslíš, že je chyba na naší straně, dej nám prosím vědět.</p>
                    <p>Chyba: {err}</p>
                {/await}
            {:else if wantsSolution}
                <SolutionCaptcha on:done={() => showSolution = true} />
            {:else}
            <!-- svelte-ignore a11y-invalid-attribute -->
            <a href="javascript:;"
               on:click|preventDefault|stopPropagation={maybeShowSolution}>
                Zobrazit řešení úlohy
            </a>
            {/if}
        </div>
    {:catch err}
        <p>Úlohu se nepodařilo načíst... Zkus stránku načíst znovu, mohlo by to být problémem s připojením. Pokud problém přetrvá, napiš nám prosím.</p>
        <p>Chyba: {err}</p>
    {/await}

    {/if}
    {/if}
</div>
