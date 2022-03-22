import { IExecOptions } from "azure-pipelines-task-lib/toolrunner";
import Q from "q";
import { OctopusToolRunner } from "./tool";
import { stdout } from "test-console";
import os from "os";

export class MockOctopusToolRunner implements OctopusToolRunner {
    arguments: string[] = [];

    arg(val: string | string[]): void {
        if (typeof val === "string") {
            this.arguments.push(val);
        } else {
            val.map((s) => this.arguments.push(s));
        }
    }

    argIf(condition: string | boolean | undefined, val: string | string[]): void {
        if (condition) {
            this.arg(val);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    exec(_?: IExecOptions): Q.Promise<number> {
        console.log(this.arguments.join(" "));
        return Q.resolve(0);
    }

    line(val: string): void {
        this.arg(val);
    }
}

export async function executeCommand(command: () => Promise<void>) {
    const output = (await stdout.inspectAsync(command)).join(os.EOL);

    console.log(output);

    expect(output).toContain("task.complete result=Succeeded");

    return output;
}
