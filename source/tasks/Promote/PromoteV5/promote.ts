import { OctoServerConnectionDetails } from "../../Utils/connection";
import { executeTask } from "../../Utils/octopusTasks";
import { OctopusToolRunner } from "../../Utils/tool";

export class Promote {
    constructor(readonly tool: OctopusToolRunner, readonly connection: OctoServerConnectionDetails) {}

    public async run(space: string, project: string, from: string, to: string[], deployForTenants: string[] = [], deployForTenantTags: string[] = [], showProgress?: boolean | undefined, additionalArguments?: string | undefined) {
        this.tool.arg("promote-release");
        this.tool.arg(["--space", `"${space}"`]);
        this.tool.arg(["--project", `"${project}"`]);
        this.tool.arg(["--from", `"${from}"`]);
        this.tool.arg("--enableServiceMessages");
        this.tool.argIf(showProgress, "--progress");
        this.tool.argIf(
            to.length > 0,
            to.map((s) => `--to "${s}"`)
        );
        this.tool.argIf(
            deployForTenants.length > 0,
            deployForTenants.map((s) => `--tenant "${s}"`)
        );
        this.tool.argIf(
            deployForTenantTags.length > 0,
            deployForTenantTags.map((s) => `--tenantTag "${s}"`)
        );

        await executeTask(this.tool, this.connection, "Promote release succeeded.", "Failed to promote release.", additionalArguments);
    }
}
