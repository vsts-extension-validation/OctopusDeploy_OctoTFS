import { mkdtemp, rm } from "fs/promises";
import * as path from "path";
import os, { platform } from "os";
import { executeCommand, MockOctopusToolRunner } from "../../Utils/testing";
import { Push } from "./push";
import { ReplaceOverwriteMode } from "../../Utils/inputs";
import archiver from "archiver";
import { createWriteStream } from "fs";

describe("Push", () => {
    let tempOutDir: string;
    let packagePath1: string, packagePath2: string;

    jest.setTimeout(100000);

    beforeAll(async () => {
        tempOutDir = await mkdtemp(path.join(os.tmpdir(), "octopus_"));

        packagePath1 = await createPackage("foo", "1.2.3");
        packagePath2 = await createPackage("boo", "1.2.3");
    });

    afterAll(async () => {
        await rm(tempOutDir, { recursive: true });
    });

    async function createPackage(name: string, version: string) {
        const packagePath = path.join(tempOutDir, `${name}.${version}.${platform() === "win32" ? "zip" : "tar.gz"}`);
        const archiveFile = createWriteStream(packagePath);
        const archive = archiver(platform() === "win32" ? "zip" : "tar", { gzip: true });
        archive.append("Hello world", { name: "readme" });
        archive.pipe(archiveFile);
        await archive.finalize();

        return packagePath;
    }

    test("Pushes multiple packages with fixed paths", async () => {
        const output = await executeCommand(() =>
            new Push(new MockOctopusToolRunner(), {
                url: "http://octopus.com",
                apiKey: "myapikey",
                ignoreSslErrors: false,
            }).run("my space", [packagePath1, packagePath2], ReplaceOverwriteMode.true, "--myAdditionalArgumentToInclude")
        );

        expect(output).toMatch(
            /push --space "my space" --overwrite-mode "OverwriteExisting" --enableServiceMessages --package ".*(foo|boo)\.1\.2\.3\.(tar.gz|zip)" --package ".*(foo|boo)\.1\.2\.3\.(tar.gz|zip)" --server http:\/\/octopus.com --apiKey myapikey --myAdditionalArgumentToInclude/
        );
    });

    test("Pushes multiple packages with wildcards", async () => {
        const output = await executeCommand(() =>
            new Push(new MockOctopusToolRunner(), {
                url: "http://octopus.com",
                apiKey: "myapikey",
                ignoreSslErrors: false,
            }).run("my space", [path.join(tempOutDir, "*.*")], ReplaceOverwriteMode.false)
        );

        expect(output).toMatch(
            /push --space "my space" --overwrite-mode "FailIfExists" --enableServiceMessages --package ".*(foo|boo)\.1\.2\.3\.(tar.gz|zip)" --package ".*(foo|boo)\.1\.2\.3\.(tar.gz|zip)" --server http:\/\/octopus.com --apiKey myapikey/
        );
    });
});
