<script lang="ts">
    import { createEventDispatcher } from "svelte";


    const a = Math.floor(Math.random() * 80) + 20
    const b = Math.floor(Math.random() * 80) + 20
    const eventDispatcher = createEventDispatcher()
    function newValue(val: number) {
        if (a + b == val) {
            eventDispatcher("done")
        }
    }
</script>

<div>
    <p>Úlohu zatím nemáš vyřešenou, opravdu si chceš vyzradit řešení?</p>
    {a} + {b} = <input type=text pattern="[0-9]+" on:input={e => newValue(+e.currentTarget.value)}>
</div>
