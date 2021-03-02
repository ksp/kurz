export function nonNull<T>(a: T | null | undefined): T { return a! }

export function copyFieldsThatExist(dest: any, source: any) {
    for (const attr of Object.keys(dest)) {
        if (attr in source) dest[attr] = source[attr]
    }
}

export function isEditableElement(e: Element | null | undefined) {
    return !!(e && ((e as HTMLElement).isContentEditable || e.tagName == "INPUT" || e.tagName == "TEXTAREA" || e.tagName == "SELECT"))
}

export function saveToLocalDisk(filename: string, text: string) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export function capitalizeFirstLetter(str: string) {
    return str[0].toUpperCase() + str.slice(1)
}

export function formatError(err: any): string {
    if ("errorMsg" in err) {
        return err.errorMsg
    } else {
        let result = "" + err
        if (result.startsWith("[object")) {
            result = JSON.stringify(err)
        }
        return result
    }
}
