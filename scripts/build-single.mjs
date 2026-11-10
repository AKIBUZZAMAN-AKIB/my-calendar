// Builds ONE self-contained, minified HTML file of the calendar:
//   npm run build:single  ->  dist/single.html
//
// 1. Tailwind CSS (src/app/globals.css) compiled + minified, only the
//    classes the calendar uses.
// 2. Geist font (latin + latin-ext) embedded as base64 woff2 (no network).
// 3. React app (single/main.tsx) bundled + minified with esbuild,
//    every comment removed (legal/license comments too).
// 4. Everything inlined into single/template.html and minified with
//    html-minifier-terser (HTML comments removed).
// The running Next.js app (.next, next start) is not touched.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { minify } from "html-minifier-terser";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmp = path.join(root, ".single-build");
const outDir = path.join(root, "dist");
const outFile = path.join(outDir, "single.html");
const r = (...p) => path.join(root, ...p);

fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// ---------- 1. fonts (base64) ----------
function fontFace(family, file, range) {
	const b64 = fs.readFileSync(r("node_modules", file)).toString("base64");
	return `@font-face{font-family:'${family}';font-style:normal;font-display:swap;font-weight:100 900;src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range}}`;
}
const LATIN =
	"U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT =
	"U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
const fontsCss = [
	fontFace("Geist", "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2", LATIN),
	fontFace("Geist", "@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2", LATIN_EXT),
	":root{--font-geist-sans:'Geist',ui-sans-serif,system-ui,sans-serif;--font-geist-mono:ui-monospace,SFMono-Regular,Menlo,monospace}",
].join("");

// ---------- 2. Tailwind CSS ----------
const globals = fs.readFileSync(r("src/app/globals.css"), "utf8");
if (!globals.includes('@import "tailwindcss";')) {
	throw new Error('globals.css: @import "tailwindcss"; not found');
}
const entryCss = globals.replace(
	'@import "tailwindcss";',
	[
		'@import "tailwindcss" source(none);',
		'@source "../src/features";',
		'@source "../src/components";',
		'@source "../src/lib";',
		'@source "../single";',
	].join("\n"),
);
fs.writeFileSync(path.join(tmp, "entry.css"), entryCss);
const tailwindBin = r("node_modules", ".bin", "tailwindcss");
execFileSync(
	tailwindBin,
	["-i", path.join(tmp, "entry.css"), "-o", path.join(tmp, "out.css"), "--minify"],
	{ cwd: root, stdio: ["ignore", "ignore", "inherit"] },
);
let css = fontsCss + fs.readFileSync(path.join(tmp, "out.css"), "utf8");
css = css.replace(/\/\*[\s\S]*?\*\//g, ""); // drop any remaining CSS comment (e.g. /*! tailwindcss license */)

// ---------- 3. JS bundle ----------
// zod's `z` re-exports all ~50 message languages (~250 KB); the app only
// needs English, so its locales index is swapped for an English-only one.
const zodEnglishOnly = {
	name: "zod-english-only",
	setup(build) {
		build.onResolve({ filter: /locales\/index\.js$/ }, (args) => {
			if (!/[\\/]zod[\\/]/.test(args.importer)) return undefined;
			return {
				path: path.join(path.dirname(args.importer), "../locales/en.js"),
				namespace: "zod-en",
			};
		});
		build.onLoad({ filter: /.*/, namespace: "zod-en" }, (args) => ({
			contents: `export { default as en } from ${JSON.stringify(args.path)};`,
			resolveDir: path.dirname(args.path),
			loader: "js",
		}));
	},
};

const result = await esbuild.build({
	entryPoints: [r("single/main.tsx")],
	bundle: true,
	// KEEP_NAMES=1 keeps function names, for profiling builds only
	minifyWhitespace: true,
	minifySyntax: true,
	minifyIdentifiers: !process.env.KEEP_NAMES,
	format: "iife",
	platform: "browser",
	target: ["es2020", "safari15"],
	jsx: "automatic",
	alias: { "@": r("src") },
	define: { "process.env.NODE_ENV": '"production"' },
	legalComments: "none",
	charset: "utf8",
	loader: { ".png": "dataurl", ".svg": "dataurl", ".woff2": "dataurl" },
	logLevel: "warning",
	write: false,
	plugins: [zodEnglishOnly],
});
let js = result.outputFiles[0].text.trim();
// a literal "</script" inside the JS would end the inline <script> early
js = js.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--");

// small inline script: put the saved / system theme class on <html> before paint
const themeScript =
	"try{var t=localStorage.getItem('theme')||'system';if(t==='system')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t}catch(e){}";

// ---------- 4. inline + minify HTML ----------
const template = fs.readFileSync(r("single/template.html"), "utf8");
const minTemplate = await minify(template, {
	collapseWhitespace: true,
	removeComments: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	useShortDoctype: true,
	minifyJS: false,
	minifyCSS: false,
});
// split/join so "$" sequences in the bundle are never treated as replace patterns
const html = minTemplate
	.split("__THEME_SCRIPT__").join(themeScript)
	.split("__CSS__").join(css)
	.split("__JS__").join(js);

fs.writeFileSync(outFile, html);
fs.rmSync(tmp, { recursive: true, force: true });

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const { gzipSync } = await import("node:zlib");
console.log(
	`dist/single.html  ${kb(Buffer.byteLength(html))}  (gzip ${kb(gzipSync(html).length)})  css ${kb(Buffer.byteLength(css))}  js ${kb(Buffer.byteLength(js))}`,
);
