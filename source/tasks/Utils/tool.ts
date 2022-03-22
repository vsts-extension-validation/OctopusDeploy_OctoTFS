import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";
import Q from "q";
import * as tasks from "azure-pipelines-task-lib";

function getExecOptions(): IExecOptions {
    return { env: { OCTOEXTENSION: process.env.EXTENSION_VERSION, ...process.env } };
}

export function runOctopusCli(tool: OctopusToolRunner) {
    return tool.exec(getExecOptions());
}

export interface OctopusToolRunner {
    arg(val: string | string[]): void;
    argIf(condition: string | boolean | undefined, val: string | string[]): void;
    line(val: string): void;
    exec(options?: IExecOptions): Q.Promise<number>;
}

export function getOctopusCliTool() {
    return tasks.tool("octo");
}
