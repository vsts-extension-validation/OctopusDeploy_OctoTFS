import * as path from "path";
import * as fs from "fs";
import * as tasks from 'vsts-task-lib/task';
import * as tools from 'vsts-task-tool-lib/tool';
import * as TypedRestClient from "typed-rest-client/RestClient";
import { ToolName } from "../Utils";
import { head, filter } from "ramda";

interface LatestResponse {
    latest :string;
    downloads: DownloadOption[];
}

type DownloadOption = {
    version: string;
    template: string;
    location: string;
    extension: string;
    platform?: string;
    architecture?:  string;
}

type Primitive = undefined | null | boolean | number | string;

interface Dictionary {
    [key: string] : Primitive;
}

const RestClient = TypedRestClient.RestClient;

var octopurls = new RestClient("OctoTFS/Tasks",  "https://g.octopushq.com");

const applyTemplate = (dictionary: Dictionary, template: string) => {
    return Object.keys(dictionary).reduce((result, key) =>
        result.replace(new RegExp(`{\s*${key}\s*}`, 'g'), dictionary[key] ? String(dictionary[key]) : ""),
        template);
}

const isPortableDownloadOption = (option: DownloadOption) =>{
    return option.platform === "portable" && option.extension === ".zip"
}

const filterPortableDownload = (options: DownloadOption[]) =>  head(filter(isPortableDownloadOption, options));

const extract = (archivePath: string) => {
    return tools.extractZip(archivePath);
}

function getExecutableExtention(): string {
    return ".dll";
}

function getLocalTool(version:string): string {
    console.log("Checking local tool cache");
    return tools.findLocalTool(ToolName, version);
}

function findOcto(rootFolder: string){
    var octoPath = path.join(rootFolder, "*" + ToolName + getExecutableExtention());
    console.log(`Looking for ${octoPath}`);
    var allPaths = tasks.find(rootFolder);
    var matches = tasks.match(allPaths, octoPath, rootFolder);
    return matches[0];
}

async function getOrDownloadOcto(option: DownloadOption): Promise<string>{
    var cachedToolPath = getLocalTool(option.version);

    if(!cachedToolPath){
        try{
            let downloadPath = await tools.downloadTool(option.location);
            let toolPath = await extract(downloadPath);

            tools.debug(`Adding ${ToolName} ${option.version} to cache`);
            tasks.writeFile(path.join(toolPath, `${ToolName}.cmd`), `dotnet "%~dp0/${ToolName}.dll" %*`);
            cachedToolPath = await tools.cacheDir(toolPath, ToolName, option.version);

        }catch(exception){
            throw new Error(`Failed to download octo tools ${option.version}. ${exception}`)
        }
    }

    const octoPath = findOcto(cachedToolPath);
    if(!octoPath){
        throw new Error("Octo wasn't found in tools directory")
    }

    tools.debug(`Found ${ToolName} at ${octoPath}`)

    fs.chmod(octoPath, "777");
    return octoPath;
}

async function resolvePublishedOctoVersion(version?: string): Promise<DownloadOption> {
    const response =  await octopurls.get<LatestResponse>("LatestTools");

    if(response.result === null || response.result === undefined){
        throw Error(`Failed to resolve octo version ${version}. Endpoint returned status code ${response.statusCode})`);
    }

    var option = filterPortableDownload(response.result.downloads);

    if(option === null || option === undefined){
        throw Error(`Failed to resolve octo portable download location. The result did not contain the download location.`);
    }

    if(version === null || version === undefined || version === "latest" || version === response.result.latest){
        return option;
    }

    //Adjust the version and location to point to the specified version
    let result = { ...option, version };
    result.location = applyTemplate(result, result.template);

    return result;
}

function addToolToPath(toolPath: string){
    if(!process.env['PATH'].startsWith(path.dirname(toolPath))){
        tools.debug(`Adding ${ToolName} to path`);
        tools.prependPath(path.dirname(toolPath));
    }

    return toolPath;
}

export { resolvePublishedOctoVersion, getOrDownloadOcto, addToolToPath }