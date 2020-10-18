<script lang="ts">
    import { createEventDispatcher } from "svelte";


    const a = Math.floor(Math.random() * 80) + 20
    const b = Math.floor(Math.random() * 80) + 20
    let ok = true
    const eventDispatcher = createEventDispatcher()
    function newValue(val: number) {
        ok = a + b == val
        if (ok) {
            eventDispatcher("done")
        }
    }
</script>

<div>
    <p>Úlohu zatím nemáš vyřešenou, opravdu si chceš vyzradit řešení?</p>
    {a} + {b} = <input type=text pattern={"" + a + b} on:input={e => newValue(+e.currentTarget.value)}>
</div>
