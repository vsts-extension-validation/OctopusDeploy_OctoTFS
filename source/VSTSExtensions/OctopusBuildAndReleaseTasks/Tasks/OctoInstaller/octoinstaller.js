"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const tasks = require("vsts-task-lib/task");
const tools = require("vsts-task-tool-lib/tool");
const RestClient_1 = require("typed-rest-client/RestClient");
const os = require("os");
const fs = require("fs");
const path = require("path");
//https://download.octopusdeploy.com/octopus-tools/4.35.0/OctopusTools.4.35.0.portable.zip
//https://download.octopusdeploy.com/octopus-tools/4.35.0/OctopusTools.4.35.0.portable.tar.gz
const toolName = "Octo";
var github = new RestClient_1.RestClient("OctoTFS/OctoInstaller", "https://api.github.com");
const octoLatestReleaseUrl = "https://api.github.com/repos/OctopusDeploy/OctopusClients/releases/latest";
const downloadUrl = (version) => `https://download.octopusdeploy.com/octopus-tools/${version}/OctopusTools.${version}.portable.tar.gz`;
const resolveVersion = (version) => __awaiter(this, void 0, void 0, function* () {
    if (!version || version.toLowerCase() === "latest") {
        return github.get("repos/OctopusDeploy/OctopusClients/releases/latest").then(x => x.result.tag_name);
    }
    return Promise.resolve(version);
});
function getLocalTool(version) {
    console.log("Checking local tool cache");
    return tools.findLocalTool(toolName, version);
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let version = yield resolveVersion(tasks.getInput("version"));
        let toolPath = yield download(version);
        if (!process.env['PATH'].startsWith(path.dirname(toolPath))) {
            tools.prependPath(path.dirname(toolPath));
        }
    });
}
function download(version) {
    return __awaiter(this, void 0, void 0, function* () {
        var cachedToolPath = getLocalTool(version);
        if (!cachedToolPath) {
            try {
                let downloadPath = yield tools.downloadTool(downloadUrl(version));
                let unzippedPath = yield tools.extractTar(downloadPath);
                cachedToolPath = yield tools.cacheDir(unzippedPath, toolName, version);
            }
            catch (exception) {
                throw new Error(`Failed to download octo tools from ${downloadUrl(version)}`);
            }
        }
        const octoPath = findOcto(cachedToolPath);
        if (!octoPath) {
            throw new Error("Octo wasn't found in tools directory");
        }
        fs.chmod(octoPath, "777");
        return octoPath;
    });
}
function findOcto(rootFolder) {
    var octoPath = path.join(rootFolder, "*" + toolName + ".dll");
    console.log(`Looking for ${octoPath}`);
    var allPaths = tasks.find(rootFolder);
    var matches = tasks.match(allPaths, octoPath, rootFolder);
    console.log(matches);
    return matches[0];
}
function getExecutableExtention() {
    return os.type().match(/^Win/) ? ".exe" : "";
}
function getTempDirectory() {
    return tasks.getVariable('agent.tempDirectory') || os.tmpdir();
}
run().then(() => {
    tasks.setResult(tasks.TaskResult.Succeeded, "");
}, (reason) => {
    tasks.setResult(tasks.TaskResult.Failed, reason);
}).catch((error) => {
    tasks.setResult(tasks.TaskResult.Failed, error);
});
