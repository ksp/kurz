<script type="ts">
    import { grabAssignment, grabSolution, isLoggedIn } from "./ksp-task-grabber";
    import type { TaskStatus } from "./ksp-task-grabber";
    import { nonNull } from './helpers'
    import App from "./App.svelte";
    import { taskStatuses } from "./task-status-cache";
    import type { TaskDescriptor } from "./tasks";
    import Odevzdavatko from "./Odevzdavatko.svelte";
    import SolutionCaptcha from "./SolutionCaptcha.svelte";

    export let task: TaskDescriptor | null | undefined

    let wantsSolution = false
    export let showSolution: boolean = false
    $: {
        task
        showSolution = false
        wantsSolution = false
    }

    let referenceId: string | null
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
    {#if nonNull(task).type == "text"}
        <div class="header">
            <div class="title"><h3>{nonNull(task).title}</h3></div>
        </div>
        {@html nonNull(task).htmlContent || "Toto je prázdný textový node 😢"}
    {:else if nonNull(task).type == "open-data"}

    {#await grabAssignment(nonNull(referenceId))}
        Načítám úlohu
    {:then task}
        <div class="header">
            <div class="title"><h3>{task.name}</h3></div>

            <div class="status">
                <p>
                    {referenceId} | {task.points} bodů
                    {#if status && status.submitted}
                        {#if nonNull(status).solved}
                        | Vyřešeno 🥳
                        {:else}
                        | odevzdáno za {nonNull(status).points} bod{ "ů yyy"[nonNull(status).points] ?? "ů" }
                        {/if}
                    {/if}
                </p>
            </div>
        </div>
        {@html task.description}

        <hr class="clearfloat" />
        {#if isLoggedIn()}
            <Odevzdavatko id={nonNull(referenceId)} />
        {:else}
            <p class="zs-warning">Pro odevzdávání je potřeba se <a href={loginUrl}>přihlásit</a>.</p>
        {/if}

        <hr class="clearfloat" />

        <div class="solution">
            {#if showSolution}

                <h4>Řešení</h4>
                {#await grabSolution(nonNull(referenceId))}
                    Načítám...
                {:then solution}
                    {@html solution.description}
                {/await}
            {:else if wantsSolution}
                <SolutionCaptcha on:done={() => showSolution = true} />
            {:else}
            <a href="javascript:;"
               on:click|preventDefault|stopPropagation={maybeShowSolution}>
                Zobrazit řešení úlohy
            </a>
            {/if}
        </div>

    {/await}

    {/if}
    {/if}
</div>
