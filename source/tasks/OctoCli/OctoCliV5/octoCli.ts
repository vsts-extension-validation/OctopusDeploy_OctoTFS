import { OctopusToolRunner } from "../../Utils/tool";
import { OctoServerConnectionDetails } from "../../Utils/connection";
import { executeTask } from "../../Utils/octopusTasks";

export class OctoCli {
    constructor(readonly toolFactory: (tool: string) => OctopusToolRunner, readonly command: string, readonly connection: OctoServerConnectionDetails) {}

    public async run(args: string | undefined) {
        await executeTask(this.toolFactory(this.command), this.connection, "Succeeded executing octo command.", "Failed to execute octo command.", args);
    }
}
