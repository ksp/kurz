<script lang="ts">
    import type { TasksFile } from "./tasks";

    export let promise: Promise<TasksFile>;

    let data: TasksFile | null = null;
    let err: any | null = null;
    promise.then(
        (d) => {
            data = d;
        },
        (e) => {
            err = e;
        }
    )
</script>

{#if data == null && err == null}
    <div>Načítám data pro vykreslení kurzu...</div>
{/if}

{#if data != null}
    <slot {data} />
{/if}

{#if err != null}
    <div>
        <p>
            Při načítání stránky nastala nějaká chyba. Nejpravděpodobněji je
            problém se stahováním dat ze stránek KSP, ale může to být i něco
            jiného. Pokud by jsi měl(a) podezření, že problém není na Tvé
            straně. Napiš nám.
        </p>
        <p>{err}</p>
    </div>
{/if}
