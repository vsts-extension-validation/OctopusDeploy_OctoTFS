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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const octoConnectedServiceName = tasks.getInput("OctoConnectedServiceName", true);
            const args = tasks.getInput("args", false);
            const command = tasks.getInput("command", true);
            const octoEndpointAuthorization = tasks.getEndpointAuthorization(octoConnectedServiceName, false);
            const octopusUrl = tasks.getEndpointUrl(octoConnectedServiceName, false);
            const apiKey = octoEndpointAuthorization.parameters["apitoken"];
            const dotnet = tasks.tool(tasks.which("dotnet", false));
            const octo = tasks.which("Octo", true);
            dotnet.arg(`${octo}.dll`);
            dotnet.arg(command);
            dotnet.arg(`--server=${octopusUrl}`);
            dotnet.arg(`--apiKey=${apiKey}`);
            dotnet.line(args);
            const code = yield dotnet.exec();
            tasks.setResult(tasks.TaskResult.Succeeded, "Succeeded with code " + code);
        }
        catch (err) {
            tasks.error(err);
            tasks.setResult(tasks.TaskResult.Failed, "Failed to execute octo command. " + err.message);
        }
    });
}
run();
