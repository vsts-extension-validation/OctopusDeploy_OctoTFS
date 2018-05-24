import * as tasks from 'vsts-task-lib/task';
import {RestClient} from "typed-rest-client/RestClient";
import { getDefaultOctoConnectionInputValue } from "./inputs";
import { Either } from "monet";

export interface OctoServerConnectionDetails {
    url: string;
    apiKey: string;
}

export function getDefaultOctopusConnectionDetails(){
    return getOctopusConnectionDetails(getDefaultOctoConnectionInputValue().some());
}

export function getOctopusConnectionDetails(name: string): OctoServerConnectionDetails {
    const octoEndpointAuthorization = tasks.getEndpointAuthorization(name, false);
    return {
        url: tasks.getEndpointUrl(name, false),
        apiKey: octoEndpointAuthorization.parameters["apitoken"]
    }
}

export function getProjectNameFromId(details: OctoServerConnectionDetails, projectId: string){
    const client = new RestClient("OctoTFS",  details.url);
    return client.get<{name: string}>(`api/projects/${projectId}`)
        .then(x => {
            if(x.result){
                return Either.Right<string, string>(x.result.name);
            }

            return Either.Left<string,string>(`Could not resolve project name given id "{projectId}". Server returned status code: ${x.statusCode}`);
        }
    )
}
