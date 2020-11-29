import App from './App.svelte';

document.getElementById("page").innerHTML = "";

const app = new App({
	target: document.getElementById("page")!,
	props: { }
});

export default app;
