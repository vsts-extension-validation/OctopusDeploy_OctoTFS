import { Installer } from "./installer";
import { mkdtemp, rm } from "fs/promises";
import * as path from "path";
import os, { platform } from "os";
import { stdout } from "test-console";
import express from "express";
import { Server } from "http";
import { AddressInfo } from "net";
import archiver from "archiver";

describe("OctoInstaller", () => {
    let tempOutDir: string;
    let octopusUrl: string;
    let server: Server;

    jest.setTimeout(100000);

    beforeAll(async () => {
        tempOutDir = await mkdtemp(path.join(os.tmpdir(), "octopus_"));
    });

    afterAll(async () => {
        await rm(tempOutDir, { recursive: true });
    });

    beforeEach(async () => {
        const app = express();

        app.get("/LatestTools", (_, res) => {
            let platform = "linux";
            let extension = ".tar.gz";
            switch (os.platform()) {
                case "darwin":
                    platform = "osx";
                    break;
                case "win32":
                    extension = ".zip;";
                    platform = "win";
                    break;
            }
            const latestToolsPayload = `{
    "latest": "9.0.0",
    "downloads": [
        {
            "version": "9.0.0",
            "template": "${octopusUrl}/octopus-tools/{version}/OctopusTools.{version}.{platform}-{architecture}{extension}",
            "architecture": "x64",
            "platform": "${platform}",
            "extension": "${extension}"
        }]
    }`;

            res.send(latestToolsPayload);
        });

        app.get("/octopus-tools/*", (_, res) => {
            const archive = archiver(platform() === "win32" ? "zip" : "tar", { gzip: true });
            archive.append("Hello world", { name: "octo" });
            archive.pipe(res);
            archive.finalize();
        });

        server = await new Promise<Server>((resolve) => {
            const r = app.listen(() => {
                resolve(r);
            });
        });

        const address = server.address() as AddressInfo;
        octopusUrl = `http://localhost:${address.port}`;
    });

    afterEach(async () => {
        await new Promise<void>((resolve) => {
            server.close(() => {
                resolve();
            });
        });
    });

    test("Installs specific version", async () => {
        process.env["AGENT_TOOLSDIRECTORY"] = tempOutDir;
        process.env["AGENT_TEMPDIRECTORY"] = tempOutDir;

        const output = (
            await stdout.inspectAsync(async () => {
                await new Installer(octopusUrl).run("8.0.0");
            })
        ).join(os.EOL);

        console.log(output);

        expect(output).toContain("task.complete result=Succeeded");
    });
});
