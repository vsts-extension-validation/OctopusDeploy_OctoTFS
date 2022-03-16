import { OctopusToolRunner } from "../../Utils/tool";
import { OctoServerConnectionDetails } from "../../Utils/connection";
import { executeTask } from "../../Utils/octopusTasks";

export class Promote {
    constructor(readonly toolFactory: (tool: string) => OctopusToolRunner, readonly connection: OctoServerConnectionDetails) {}

    public async run(space: string, project: string, from: string, to: string[], deployForTenants: string[] = [], deployForTenantTags: string[] = [], showProgress?: boolean | undefined, additionalArguments?: string | undefined) {
        const tool = this.toolFactory("promote-release");

        tool.arg(["--space", `"${space}"`]);
        tool.arg(["--project", `"${project}"`]);
        tool.arg(["--from", `"${from}"`]);
        tool.arg("--enableServiceMessages");
        tool.argIf(showProgress, "--progress");
        tool.argIf(
            to.length > 0,
            to.map((s) => `--to "${s}"`)
        );
        tool.argIf(
            deployForTenants.length > 0,
            deployForTenants.map((s) => `--tenant "${s}"`)
        );
        tool.argIf(
            deployForTenantTags.length > 0,
            deployForTenantTags.map((s) => `--tenantTag "${s}"`)
        );

        await executeTask(tool, this.connection, "Promote release succeeded.", "Failed to promote release.", additionalArguments);
    }
}
