<script>
	let hovering;

	function enter() {
        hovering = true;
	}

	function leave() {
        hovering = false;
	}
</script>

<g on:mouseenter={enter} on:mouseleave={leave}>
	<slot hovering={hovering}></slot>
</g>
