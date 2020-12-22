const xs: (() => void)[] = []

export function add(x: () => void) {
    xs.push(x)
}

export function remove(x: () => void) {
    xs.splice(xs.indexOf(x), 1)
}

export function sync() {
    xs.forEach(x => x())
}
