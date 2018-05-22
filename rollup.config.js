import glob from "glob";
import resolve from 'rollup-plugin-node-resolve';
import path from "path";
import typescriptPlugin from 'rollup-plugin-typescript';
import typescript from "typescript";
import copy from 'rollup-plugin-copy-glob';

const resolveTasks = () => {
    return new Promise((resolve, reject) => {
        glob("source/tasks/**/index.ts", (err, matches) => {
            if(err){
                reject(err);
            }
            resolve(matches);
        });
    })
};

const createTaskConfig = (filePath) => {
    const outFolder = `dist/tasks/${path.basename(path.dirname(filePath))}`;
    return {
        input: filePath,
        output:{
            file: `${outFolder}/index.js`,
            format: 'cjs'
        },
        plugins: [
            resolve({
                jsnext: true,
                extensions: [ ".ts", ".js", ".json" ]
            }),
            typescriptPlugin({
                typescript
            }),
            copy([
                { files: `${path.dirname(filePath)}/**/*.{json,png,svg}`, dest: outFolder  }
            ])

        ]
    }
}

export default Promise.all([
    resolveTasks()
]).then(([tasks]) => {
    return [
        ...tasks.map(createTaskConfig)
    ];
})
