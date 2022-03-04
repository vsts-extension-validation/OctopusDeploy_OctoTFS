import { build } from "esbuild";
import { cleanPlugin } from "esbuild-clean-plugin";
import { esbuildPluginNodeExternals } from "esbuild-plugin-node-externals";
import copyStaticFiles from "esbuild-copy-static-files";
import glob from "glob";
import { join } from "path";
import { statSync } from "fs";
import yargs from "yargs";

const __dirname = new URL(".", import.meta.url).pathname;

function entryPoints() {
    function doReplacements(entries, source) {
        const matches = glob.sync(join(__dirname, "source", source, "**", "index.ts"));

        for (let match of matches) {
            const key = match.replace(join(__dirname, "source", source) + "/", "tasks/").replace(".ts", "");
            entries[key] = match;
        }
    }

    const entries = {};
    doReplacements(entries, "tasks");
    doReplacements(entries, "tasksLegacy");

    return entries;
}

const argv = yargs(process.argv).argv;

function noTSFiles(src) {
    if (src.endsWith(".ts")) {
        return false;
    }

    return true;
}

function noFolders(src) {
    if(src === "./source") {
        return true;
    }

    return !statSync(src).isDirectory();
}

build({
    entryPoints: entryPoints(),
    bundle: true,
    target: "es2015",
    platform: "node",
    outdir: "dist",
    metafile: true,
    plugins: [
        cleanPlugin(),
        copyStaticFiles({ src: "./source/img", dest: "dist/img" }),
        copyStaticFiles({ src: "./source", dest: "dist", recursive: false, filter: noFolders }),
        copyStaticFiles({ src: "./source/widgets", dest: "dist/widgets" }),
        copyStaticFiles({ src: "./node_modules/vss-web-extension-sdk/lib", dest: "dist/widgets/ProjectStatus/lib" }),
        //copyStaticFiles({ src: "./source/tasks", dest: "dist/tasks", recursive: true, filter: noTSFiles }),
        copyStaticFiles({ src: "./source/tasksLegacy", dest: "dist/tasks", filter: noTSFiles }),
        esbuildPluginNodeExternals(),
    ],
    logLimit: 0,
    logLevel: "info",
    define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV), "process.env.EXTENSION_VERSION": JSON.stringify(argv.extensionVersion) },
}).catch(() => process.exit(1));
