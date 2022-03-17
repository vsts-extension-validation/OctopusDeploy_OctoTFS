import { CreateRelease } from "./createRelease";
import { executeCommand, MockOctopusToolRunner } from "../../Utils/testing";

describe("Create Release", () => {
    test("Create a minimum release", async () => {
        const output = await executeCommand(() => new CreateRelease(new MockOctopusToolRunner(), { url: "http://octopus.com", apiKey: "myapikey", ignoreSslErrors: false }).run("my space", "my project"));

        expect(output).toContain('create-release --space "my space" --project "my project" --enableServiceMessages --server http://octopus.com --apiKey myapikey');
    });

    test("Create a release and deployment", async () => {
        const output = await executeCommand(() =>
            new CreateRelease(new MockOctopusToolRunner(), { url: "http://octopus.com", apiKey: "myapikey", ignoreSslErrors: false }).run(
                "my space",
                "my project",
                "1.2.3",
                "mychannel",
                "special release notes",
                ["dev", "prod"],
                ["tenantA", "tenantB"],
                ["tagme", "tagyou"],
                false,
                "--myAdditionalArgumentToInclude",
                "mygitref",
                "mygitcommit"
            )
        );

        expect(output).toContain(
            'create-release --space "my space" --project "my project" --releaseNumber "1.2.3" --channel "mychannel" --gitCommit "mygitcommit" --gitRef "mygitref" --releaseNotes "special release notes" --enableServiceMessages --deployTo "dev" --deployTo "prod" --tenant "tenantA" --tenant "tenantB" --tenantTag "tagme" --tenantTag "tagyou" --server http://octopus.com --apiKey myapikey --myAdditionalArgumentToInclude'
        );
    });
});
