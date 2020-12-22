<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as ckeditorSynchronizer  from './ckeditorSynchronizer'
    import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

    export let html: string

    // setup editor
    let editor: any
    let editorTextarea: HTMLTextAreaElement | undefined
    let _this: any
    onMount(() => {
        ClassicEditor.create(editorTextarea!)
            .then((e: any) => {
                editor = e
            })
            .catch((error: any) => {
                alert("Editor init error. Open console to see details.")
                console.error(error)
            });
        ckeditorSynchronizer.add(sync)
    })

    function sync() {
        if (editor) {
            html = editor.getData()
        }
    }

    onDestroy(() => {
        ckeditorSynchronizer.remove(sync)
        editor.destroy()
    })

</script>

<textarea bind:this={editorTextarea}>{html}</textarea>
