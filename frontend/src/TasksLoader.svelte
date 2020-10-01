<script lang="ts">
  import type { TasksFile } from "./tasks";
  import { refresh } from './task-status-cache'

  export let promise: Promise<TasksFile>;


  let data: TasksFile | null = null;
  let err: any | null = null;
    promise.then(
        (d) => {
            refresh(d.tasks.map(t => t.id))
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
