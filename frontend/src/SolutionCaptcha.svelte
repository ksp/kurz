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

<style>
     /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* Firefox */
    input[type=number] {
        -moz-appearance: textfield;
    }
</style>

<div>
    <p>Úlohu zatím nemáš vyřešenou, opravdu si chceš vyzradit řešení?</p>
    {a} + {b} = <input type="number" on:input={e => newValue(+e.currentTarget.value)}>
</div>
