import { executeCommand, MockOctopusToolRunner } from "../../Utils/testing";
import { OctoCli } from "./octoCli";

describe("Promote Release", () => {
    test("Run a simple promote", async () => {
        const output = await executeCommand(() =>
            new OctoCli(new MockOctopusToolRunner(), "list-projects", {
                url: "http://octopus.com",
                apiKey: "myapikey",
                ignoreSslErrors: true,
            }).run('--space "my space"')
        );

        expect(output).toContain('list-projects --server http://octopus.com --apiKey "myapikey" --ignoreSslErrors --space "my space"');
    });
});
