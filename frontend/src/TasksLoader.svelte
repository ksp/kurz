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
    <div>Loading...</div>
{/if}

{#if data != null }
    <slot {data} />
{/if}

{#if err != null }
    <div>Error - {err}</div>
{/if}
