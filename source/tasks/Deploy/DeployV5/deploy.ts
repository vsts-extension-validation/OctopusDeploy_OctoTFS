import { OctopusToolRunner } from "../../Utils/tool";
import { OctoServerConnectionDetails } from "../../Utils/connection";
import { executeTask } from "../../Utils/octopusTasks";

export class Deploy {
    constructor(readonly toolFactory: (tool: string) => OctopusToolRunner, readonly connection: OctoServerConnectionDetails) {}

    public async run(
        space: string,
        project: string,
        releaseNumber: string,
        deployToEnvironments: string[],
        deployForTenants: string[] = [],
        deployForTenantTags: string[] = [],
        showProgress?: boolean | undefined,
        additionalArguments?: string | undefined
    ) {
        const tool = this.toolFactory("deploy-release");

        tool.arg(["--space", `"${space}"`]);
        tool.arg(["--project", `"${project}"`]);
        tool.argIf(releaseNumber, ["--releaseNumber", `"${releaseNumber}"`]);
        tool.arg("--enableServiceMessages");
        tool.argIf(showProgress, "--progress");
        tool.argIf(
            deployToEnvironments.length > 0,
            deployToEnvironments.map((s) => `--deployTo "${s}"`)
        );
        tool.argIf(
            deployForTenants.length > 0,
            deployForTenants.map((s) => `--tenant "${s}"`)
        );
        tool.argIf(
            deployForTenantTags.length > 0,
            deployForTenantTags.map((s) => `--tenantTag "${s}"`)
        );

        await executeTask(tool, this.connection, "Deployment succeeded.", "Failed to deploy release.", additionalArguments);
    }
}
