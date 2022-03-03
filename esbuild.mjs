import { build } from "esbuild";
import { cleanPlugin } from "esbuild-clean-plugin";
import { copy } from "esbuild-plugin-copy";
import glob from "glob";
import { dirname, join } from "path";
import { statSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

function filesToCopy() {
    function doTasks(toCopy, source) {
        const matches = glob.sync(join(__dirname, "source", source, "**", "*"));
        for (let match of matches) {
            if (match.endsWith(".ts")) {
                continue;
            }

            if (statSync(match).isDirectory()) {
                continue;
            }

            const to = match.replace(join(__dirname, "source", source) + "/", "./tasks/");
            toCopy.push({
                from: match.replace(join(__dirname, "source") + "/", "./source/"),
                to: to.substring(0, to.lastIndexOf("/")),
            });
        }
    }

    const toCopy = [
        {
            from: "./source/img/**/*",
            to: "./img",
        },
        {
            from: "./source/*.*",
            to: "./",
        },
        {
            from: "./source/widgets/ProjectStatus/*",
            to: "./widgets/ProjectStatus",
        },
        {
            from: "./source/widgets/ProjectStatus/js/*",
            to: "./widgets/ProjectStatus/js",
        },
        {
            from: "./node_modules/vss-web-extension-sdk/lib/**/*",
            to: "./widgets/ProjectStatus/lib",
        },
    ];

    doTasks(toCopy, "tasks");
    doTasks(toCopy, "tasksLegacy");

    return toCopy;
}

build({
    entryPoints: entryPoints(),
    bundle: true,
    target: "node10",
    platform: "node",
    outdir: "dist",
    metafile: true,
    plugins: [
        cleanPlugin(),
        copy({
            verbose: false,
            assets: filesToCopy(),
        }),
    ],
}).catch(() => process.exit(1));
