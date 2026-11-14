import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const nodeExternal = [
	"node:http", "node:https", "node:net", "node:tls", "node:crypto",
	"node:buffer", "node:stream", "node:events", "node:url", "node:zlib",
	"bufferutil", "utf-8-validate"
];

export default [
	// ── 1. Plugin bundle (Node.js CJS) ────────────────────────────────────────
	{
		input: "src/plugin.ts",
		output: {
			file: "com.karaokebrowser.plugin.sdPlugin/bin/plugin.js",
			format: "cjs",
			exports: "auto",
			sourcemap: true
		},
		plugins: [
			nodeResolve({ preferBuiltins: true }),
			commonjs(),
			typescript({ tsconfig: "./tsconfig.json" })
		],
		external: nodeExternal
	}
];
