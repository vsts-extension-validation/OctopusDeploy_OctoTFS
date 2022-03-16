import * as tools from "azure-pipelines-tool-lib";
import * as tasks from "azure-pipelines-task-lib";
import os from "os";
import { IProxyConfiguration } from "typed-rest-client/Interfaces";
import * as TypedRestClient from "typed-rest-client";
import path from "path";
import { executeWithSetResult } from "../../Utils/octopusTasks";

const TOOL_NAME = "octo";

const osPlat: string = os.platform();

interface LatestResponse {
    latest: string;
    downloads: DownloadOption[];
}

type DownloadOption = {
    version: string;
    template: string;
    location: string;
    extension: string;
    platform?: string;
    architecture?: string;
};

type Primitive = undefined | null | boolean | number | string;

interface Dictionary {
    [key: string]: Primitive;
}

export class Installer {
    constructor(readonly octopusUrl: string) {}

    public async run(version: string) {
        await executeWithSetResult(
            async () => {
                let toolPath = tools.findLocalTool(TOOL_NAME, version);

                if (!toolPath) {
                    toolPath = await this.installTool(version);
                    toolPath = tools.findLocalTool(TOOL_NAME, version);
                }

                tools.prependPath(toolPath);
            },
            `Installed octo v${version}.`,
            `Failed to install octo v${version}.`
        );
    }

    private applyTemplate(dictionary: Dictionary, template: string) {
        return Object.keys(dictionary).reduce((result, key) => result.replace(new RegExp(`{${key}}`, "g"), dictionary[key] ? String(dictionary[key]) : ""), template);
    }

    private async installTool(version: string): Promise<string> {
        console.log(`Attempting to contact ${this.octopusUrl} to find Octopus CLI tool version ${version}`);

        const proxyConfiguration = tasks.getHttpProxyConfiguration(this.octopusUrl);
        let proxySettings: IProxyConfiguration | undefined = undefined;

        if (proxyConfiguration) {
            console.log(
                "Using agent configured proxy. If this command should not be sent via the agent's proxy, you might need to add or modify the agent's .proxybypass file. See https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/proxy#specify-proxy-bypass-urls."
            );
            proxySettings = {
                proxyUrl: proxyConfiguration.proxyUrl,
                proxyUsername: proxyConfiguration.proxyUsername,
                proxyPassword: proxyConfiguration.proxyPassword,
                proxyBypassHosts: proxyConfiguration.proxyBypassHosts,
            };
        }

        const octopurls = new TypedRestClient.RestClient("OctoTFS/Tasks", this.octopusUrl, undefined, { proxy: proxySettings });

        const response = await octopurls.get<LatestResponse>("LatestTools");

        if (response.result === null || response.result === undefined) {
            throw Error(`Failed to resolve Octopus CLI tool version ${version}. Endpoint returned ${response.statusCode} status code.`);
        }

        let platform = "linux";
        switch (osPlat) {
            case "darwin":
                platform = "osx";
                break;
            case "win32":
                platform = "win";
                break;
        }

        let downloadUrl: string | undefined;

        for (const download of response.result.downloads) {
            if (download.platform === platform) {
                const result = { ...download, version };
                downloadUrl = this.applyTemplate(result, download.template);
            }
        }

        if (!downloadUrl) {
            throw Error(`Failed to download Octopus CLI tool version ${version}.`);
        }

        const downloadPath = await tools.downloadTool(downloadUrl);

        //
        // Extract
        //
        let extPath: string;
        if (osPlat == "win32") {
            extPath = tasks.getVariable("Agent.TempDirectory") || "";
            if (!extPath) {
                throw new Error("Expected Agent.TempDirectory to be set");
            }

            extPath = path.join(extPath, "n"); // use as short a path as possible due to nested node_modules folders
            extPath = await tools.extract7z(downloadPath, extPath);
        } else {
            extPath = await tools.extractTar(downloadPath);
        }

        return await tools.cacheDir(extPath, TOOL_NAME, version);
    }
}
