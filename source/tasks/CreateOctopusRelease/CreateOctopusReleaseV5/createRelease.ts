import { OctopusToolRunner } from "../../Utils/tool";
import { executeTask } from "../../Utils/octopusTasks";
import { OctoServerConnectionDetails } from "../../Utils/connection";

export class CreateRelease {
    constructor(readonly toolFactory: (tool: string) => OctopusToolRunner, readonly connection: OctoServerConnectionDetails) {}

    public async run(
        space: string,
        project: string,
        releaseNumber?: string | undefined,
        channel?: string | undefined,
        customReleaseNotes?: string | undefined,
        deployToEnvironments: string[] = [],
        deployForTenants: string[] = [],
        deployForTenantTags: string[] = [],
        deploymentProgress?: boolean | undefined,
        additionalArguments?: string | undefined,
        gitRef?: string | undefined,
        gitCommit?: string | undefined
    ) {
        const tool = this.toolFactory("create-release");

        tool.arg(["--space", `"${space}"`]);
        tool.arg(["--project", `"${project}"`]);
        tool.argIf(releaseNumber, ["--releaseNumber", `"${releaseNumber}"`]);
        tool.argIf(channel, ["--channel", `"${channel}"`]);
        tool.argIf(gitCommit, ["--gitCommit", `"${gitCommit}"`]);
        tool.argIf(gitRef, ["--gitRef", `"${gitRef}"`]);
        tool.argIf(customReleaseNotes, ["--releaseNotes", `"${customReleaseNotes}"`]);
        tool.arg("--enableServiceMessages");
        tool.argIf(deploymentProgress, "--progress");
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

        await executeTask(tool, this.connection, "Create release succeeded.", "Failed to create release.", additionalArguments);
    }
}
