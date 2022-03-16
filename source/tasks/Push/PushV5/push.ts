import { OctopusToolRunner } from "../../Utils/tool";
import { OctoServerConnectionDetails } from "../../Utils/connection";
import { ReplaceOverwriteMode } from "../../Utils/inputs";
import { executeTask } from "../../Utils/octopusTasks";
import glob from "glob";

export class Push {
    constructor(readonly toolFactory: (tool: string) => OctopusToolRunner, readonly connection: OctoServerConnectionDetails) {}

    public async run(space: string, packages: string[], overwriteMode: ReplaceOverwriteMode, additionalArguments?: string | undefined) {
        const tool = this.toolFactory("push");

        const matchedPackages = await this.resolveGlobs(packages);

        tool.arg(["--space", `"${space}"`]);
        tool.arg(["--overwrite-mode", `"${overwriteMode}"`]);
        tool.arg("--enableServiceMessages");
        tool.argIf(
            matchedPackages.length > 0,
            matchedPackages.map((s) => `--package "${s}"`)
        );

        await executeTask(tool, this.connection, "Package(s) pushed.", "Failed to push package(s).", additionalArguments);
    }

    private resolveGlobs = async (globs: string[]): Promise<string[]> => {
        const globResults = await Promise.all(globs.map(this.pGlobNoNull));
        const results = ([] as string[]).concat(...globResults);

        return results;
    };

    private pGlobNoNull = (pattern: string): Promise<string[]> => {
        return new Promise((resolve, reject) => {
            glob(pattern, { nonull: true }, (err, matches) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(matches);
            });
        });
    };
}
