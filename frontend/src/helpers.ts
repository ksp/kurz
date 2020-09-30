export function nonNull<T>(a: T | null | undefined): T { return a! }

export function copyFieldsThatExist(dest: any, source: any) {
    for (const attr of Object.keys(dest)) {
        if (attr in source) dest[attr] = source[attr]
    }
}
