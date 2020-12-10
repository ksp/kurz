<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

    export let html: string

    // setup editor
    let editor;
    let editorTextarea: HTMLTextAreaElement | undefined
    onMount(() => {
        ClassicEditor.create(editorTextarea!)
            .then((e) => {
                editor = e;

                e.on('change', function() {
                    if (html == null)
                        html = e.getData()
                });
            })
            .catch((error) => {
                alert("Editor init error. Open console to see details.");
                console.error(error);
            });
    });

    onDestroy(() => {
        editor.destroy();
    })
</script>

<textarea bind:this={editorTextarea}>{html}</textarea>
