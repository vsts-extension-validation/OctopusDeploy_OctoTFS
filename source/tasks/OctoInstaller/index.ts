import * as tasks from 'vsts-task-lib/task';
import * as tools from 'vsts-task-tool-lib/tool';
import * as TypedRestClient from "typed-rest-client/RestClient";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

interface LatestResponse {
    "tag_name":string;
}
const RestClient = TypedRestClient.RestClient;

const toolName = "Octo";

var github = new RestClient("OctoTFS/OctoInstaller",  "https://api.github.com");

const resolveDownloadUrl = (version:string) => {
    let url = `https://download.octopusdeploy.com/octopus-tools/${version}/OctopusTools.${version}`;

    switch(os.type()){
        case "Linux": return `${url}.linux-x64.tar.gz`;
        case "Darwin": return `${url}.osx-x64.tar.gz`;
        default:
        case "Windows_NT": return `${url}.win7-x64.zip`;
    }
};

const extract = (archivePath: string) => {
    if(/$\.tar\.gz/i.test(archivePath)){
        return tools.extractTar(archivePath);
    }

    switch(path.extname(archivePath)){
        case ".zip": return tools.extractZip(archivePath);
        case ".7z": return tools.extract7z(archivePath);
        default: throw new Error(`Unknown archive format ${path.extname(archivePath)}`);
    }
}

function getExecutableExtention(): string {
    return os.type().match(/^Win/) ? ".exe" : "";
}

const resolveVersion = async (version: string) => {
    if(!version || version.toLowerCase() === "latest"){
        return github.get<LatestResponse>("repos/OctopusDeploy/OctopusClients/releases/latest").then(x => x.result ? x.result.tag_name : "");
    }
    return Promise.resolve(version);
}

function getLocalTool(version:string): string {
    console.log("Checking local tool cache");
    return tools.findLocalTool(toolName, version);
}

function findOcto(rootFolder: string){
    var octoPath = path.join(rootFolder, "*" + toolName + getExecutableExtention());
    console.log(`Looking for ${octoPath}`);
    var allPaths = tasks.find(rootFolder);
    var matches = tasks.match(allPaths, octoPath, rootFolder);
    return matches[0];
}

async function run(){
    let version = await resolveVersion(tasks.getInput("version"));
    let toolPath =  await download(version);

    if(!process.env['PATH'].startsWith(path.dirname(toolPath))){
        tools.prependPath(path.dirname(toolPath));
    }
}

async function download(version: string): Promise<string>{
    var cachedToolPath = getLocalTool(version);

    if(!cachedToolPath){
        try{
            let downloadPath = await tools.downloadTool(resolveDownloadUrl(version));
            let toolPath = await extract(downloadPath);
            cachedToolPath = await tools.cacheDir(toolPath, toolName, version);

        }catch(exception){
            throw new Error(`Failed to download octo tools from ${resolveDownloadUrl(version)}`)
        }
    }

    const octoPath = findOcto(cachedToolPath);
    if(!octoPath){
        throw new Error("Octo wasn't found in tools directory")
    }

    fs.chmod(octoPath, "777");
    return octoPath;
}

run().then(() => {
    tasks.setResult(tasks.TaskResult.Succeeded, "")
}, (reason) => {
    tasks.setResult(tasks.TaskResult.Failed, reason)
}).catch((error) => {
    tasks.setResult(tasks.TaskResult.Failed, error)
});