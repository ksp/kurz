<script type="ts">
  import Editor from "./Editor.svelte";
  import Modal from "svelte-simple-modal";
  import { loadTasks } from "./tasks";
  import type { TasksFile, TaskDescriptor } from "./tasks";
  import TasksLoader from "./TasksLoader.svelte";

  const tasksPromise: Promise<TasksFile> = loadTasks();


</script>

<style>
  main {
    text-align: center;
    margin: 0 auto;
    min-height: 420px;
  }
</style>

<main>
  <Modal>
    <TasksLoader promise={tasksPromise} let:data={t}>
      <Editor tasks={t}/>
    </TasksLoader>
  </Modal>
</main>
