import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace'

const production = !process.env.ROLLUP_WATCH;
const halfProduction = production || !!process.env.HALF_PRODUCTION;

// generate SVG with the current commit hash
require('child_process').spawn('bash', ['generate_commit_image.sh'], {
	stdio: ['ignore', 'inherit', 'inherit'],
	shell: true
});

function serve() {
	let server;
	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

function plugins(editor=false, search=false) {
	return [
		svelte({
			// enable run-time checks when not in production
			dev: !halfProduction,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write(editor ? 'editor.css' : search ? 'search.css' : 'bundle.css');
			},
			preprocess: sveltePreprocess(),
		}),

		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({
			sourceMap: !halfProduction,
			inlineSources: !halfProduction
		}),
		replace({
			"allowEditor": editor,
		}),


		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!halfProduction && !editor && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		halfProduction && !editor && terser()
	]
}

export default [{
	input: 'src/main.ts',
	output: {
		sourcemap: !halfProduction,
		format: 'es',
		file: 'public/build/bundle.js'
	},
	plugins: plugins(false).concat([
		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve()
	]),
	watch: {
		clearScreen: false
	}
},
{
	input: 'src/editor-main.ts',
	output: {
		sourcemap: !halfProduction,
		format: 'es',
		file: 'public/build/editor.js'
	},
	plugins: plugins(true)
},
{
	input: 'src/search-main.ts',
	output: {
		sourcemap: !halfProduction,
		format: 'es',
		file: 'public/build/search.js'
	},
	plugins: plugins(false, true)
}];
