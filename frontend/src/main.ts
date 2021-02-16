import App from './App.svelte';

// cleanup basic KSP layout while preserving exactly the header
let header = document.getElementById("header")!;
document.body.innerHTML = "";
document.body.appendChild(header);
let appRoot = document.createElement("div");
document.body.appendChild(appRoot);

const app = new App({
	target: appRoot,
	props: { }
});

export default app;
