import * as tasks from "vsts-task-lib/task";
import { Maybe } from "monet";

export const DefaultOctoConnectionInputName = "OctoConnectedServiceName";

export function isNullOrWhitespace(value: string){
    return (!value || !/\S/.test(value));
}

export function safeTrim(value: string): string | null {
    return value ? value.trim() : value;
}

export function getLineSeparatedItems(value: string): Array<string>{
    return value ? value.replace("\r", "").split("\n") : [];
}

const getRequiredInput = (name: string) => {
    return Maybe.fromNull(tasks.getInput(name, true));
}

const splitComma = (x: string) => x.split(",").map(x => x.trim());

const getOptionalInput = (name: string) => {
    return Maybe.fromNull(tasks.getInput(name, false));
}

export const getOptionalCsvInput = (name: string) => {
    return getOptionalInput(name).map(splitComma).orJust([]);
}

export const getRequiredCsvInput = (name: string) => {
    return getRequiredInput(name).map(splitComma).orJust([]);
}

export { getRequiredInput, getOptionalInput }

export function getDefaultOctoConnectionInputValue() {
    return getRequiredInput(DefaultOctoConnectionInputName)
};
