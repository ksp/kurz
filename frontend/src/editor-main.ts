import Editor from './Editor-main.svelte';
import { loadTasks } from './tasks';
import type { TasksFile } from './tasks'

const app = new Editor({
    target: document.getElementById("svelte-root")!,
    props: {}
});
