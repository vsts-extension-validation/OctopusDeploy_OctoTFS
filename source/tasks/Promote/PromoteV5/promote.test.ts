import { executeCommand, MockOctopusToolRunner } from "../../Utils/testing";
import { Promote } from "./promote";

describe("Promote Release", () => {
    test("Run a simple promote", async () => {
        const output = await executeCommand(() =>
            new Promote((command) => new MockOctopusToolRunner(command), { url: "http://octopus.com", apiKey: "myapikey", ignoreSslErrors: true }).run(
                "my space",
                "my project",
                "Dev",
                ["int", "prod"],
                ["tenantA", "tenantB"],
                ["tagme", "tagyou"],
                true,
                "--myAdditionalArgumentToInclude"
            )
        );

        expect(output).toContain(
            'promote-release --space "my space" --project "my project" --from "Dev" --enableServiceMessages --progress --to "int" --to "prod" --tenant "tenantA" --tenant "tenantB" --tenantTag "tagme" --tenantTag "tagyou" --server http://octopus.com --apiKey "myapikey" --ignoreSslErrors --myAdditionalArgumentToInclude'
        );
    });
});
