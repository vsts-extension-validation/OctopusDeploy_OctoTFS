
export function isNullOrWhitespace(value: string){
    return (!value || !/\S/.test(value));
}

export function safeTrim(value: string): string | null {
    return value ? value.trim() : value;
}

export function getLineSeparatedItems(value: string): Array<string>{
    return value ? value.replace("\r", "").split("\n") : [];
}