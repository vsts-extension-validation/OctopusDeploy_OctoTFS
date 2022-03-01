import glob from "glob";
import path from "path";
import CopyPlugin from 'copy-webpack-plugin';
import { Configuration } from "webpack";

const config: Configuration = {
    mode: 'production',
    target: 'node',
    entry: () => {
        return new Promise((resolve, reject) => {
            glob(path.join(__dirname, 'source', 'tasks', '**', 'index.ts'), (err, matches) => {
                if(err){
                    reject(err);
                }
                const entries: {[key: string]: string } = {};
                for (let match of matches) {
                    const key = match.replace(path.join(__dirname, 'source') + '/', '').replace(".ts", ".js");
                    entries[key] = match;
                }
                resolve(entries);
            });
        });
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'img/**/*',
                    context: path.join(__dirname, 'source'),
                },
                {
                    from: '*.*',
                    context: path.join(__dirname, 'source'),
                },
                {
                    from: 'widgets/**/*',
                    context: path.join(__dirname, 'source'),
                },
                {
                    from: 'lib/**/*',
                    to: 'widgets/ProjectStatus',
                    context: path.join(__dirname, 'node_modules', 'vss-web-extension-sdk'),
                },
                {
                    from: '**/*',
                    to: 'tasks',
                    globOptions: {
                        ignore: ['**/*.ts'],
                    },
                    context: path.join(__dirname, 'source', 'tasks'),
                },
            ],
        }),
    ],
    output: {
        clean: true,
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]',
    },
};

export default config;

