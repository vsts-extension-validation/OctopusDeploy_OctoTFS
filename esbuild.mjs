import { build } from 'esbuild';
import { cleanPlugin } from 'esbuild-clean-plugin';
import { copy } from 'esbuild-plugin-copy';
import glob from "glob";
import { dirname, join } from 'path';
import { statSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function entryPoints() {
    const matches = glob.sync(join(__dirname, 'source', 'tasks', '**', 'index.ts'));
    const entries = {};

    for (let match of matches) {
        const key = match.replace(join(__dirname, 'source') + '/', '').replace(".ts", "");
        entries[key] = match;
    }

    return entries;
}

function filesToCopy() {
    const matches = glob.sync(join(__dirname, 'source', 'tasks', '**', '*'));

    const toCopy = [{
        from: './source/img/**/*',
        to: './img',
    },
        {
            from: './source/*.*',
            to: './',
        },
        {
            from: './source/widgets/ProjectStatus/*',
            to: './widgets/ProjectStatus'
        },
        {
            from: './source/widgets/ProjectStatus/js/*',
            to: './widgets/ProjectStatus/js'
        },
        {
            from: './node_modules/vss-web-extension-sdk/lib/**/*',
            to: './widgets/ProjectStatus/lib',
        }];
    for (let match of matches) {
        if(match.endsWith(".ts")) {
            continue;
        }

        if(statSync(match).isDirectory()){
            continue;
        }

        const to = match.replace(join(__dirname, 'source') + '/', './');
        toCopy.push({
            from: match.replace(join(__dirname, 'source') + '/', './source/'),
            to: to.substring(0, to.lastIndexOf("/")),
        });
    }

    return toCopy;
}

build({
    entryPoints: entryPoints(),
    bundle: true,
    target: 'node10',
    platform: 'node',
    outdir: 'dist',
    metafile: true,
    plugins: [cleanPlugin(), copy({
        verbose: false,
        assets: filesToCopy(),
    })],
}).catch(() => process.exit(1))