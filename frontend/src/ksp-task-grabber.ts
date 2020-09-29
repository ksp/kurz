export type TaskAssignmentData = {
    id: string,
    name: string,
    points: number | null,
    description: string,
    titleHtml: string
}

type TaskLocation = {
    /** Relative location of HTML file containing this task */
    url: string
    /** id of the element where the specific task begins */
    startElement: string
}

function fixLink(link: string, currentPath: string): string {
    const url = new URL(link, currentPath)
    if (url.host == "ksp.mff.cuni.cz" || url.host == "ksp-test.ks.matfyz.cz") {
        url.host = location.host
    }
    if (url.host == location.host) {
        return url.pathname
    } else {
        return url.href
    }
}

function fixAllLinks(e: any, currentPath: string) {
    if (typeof e.src == "string") {
        e.src = e.src
    }
    if (typeof e.href == "string") {
        e.href = e.href
    }
    let c = (e as HTMLElement).firstElementChild
    while (c) {
        fixAllLinks(c, currentPath)
        c = c.nextElementSibling
    }
}

function getLocation(id: string, solution: boolean): TaskLocation | null {
    const m = /^(\d+)-(Z?)(\d)-(\d)$/.exec(id)
    if (!m) return null
    const [_, rocnik, z, serie, uloha] = m
    if (z == 'Z') {
        const urlX = solution ? "reseni" : "zadani"
        return {
            url: `z/ulohy/${rocnik}/${urlX}${serie}.html`,
            startElement: `task-${id}`
        }
    } else {
        const urlX = solution ? "solution" : "tasks"
        return {
            url: `tasks/${rocnik}/${urlX}${serie}.html`,
            startElement: `task-${id}`
        }
    }
}

function parseTask(startElementId: string, html: string, currentPath: string): TaskAssignmentData {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    if (!doc.head.querySelector("base")) {
        let baseEl = doc.createElement('base');
        baseEl.setAttribute('href', new URL(currentPath, location.href).href);
        doc.head.append(baseEl);
    }

    const titleElement = doc.getElementById(startElementId)
    if (!titleElement)
        throw new Error(`Document does not contain ${startElementId}`)
    fixAllLinks(titleElement, currentPath)
    const elements = []

    let e = titleElement

    const titleMatch = /(\d-Z?\d+-\d+) (.*?)( \((\d+) bod.*\))?/.exec(e.innerText.trim())
    if (!titleMatch) {
        var [_, id, name, __, points] = ["", startElementId, "Neznámé jméno úlohy", "", ""]
    } else {
        var [_, id, name, __, points] = titleMatch
    }

    while (e.nextElementSibling &&
           e.nextElementSibling?.tagName.toLowerCase() == "hr")
        e = e.nextElementSibling as HTMLElement

    while (!e.classList.contains("story") &&
        //    !e.classList.contains("clearfloat") &&
           e.tagName.toLowerCase() != "h3" &&
           e.innerText.trim() != "Řešení"
        )
    {
        elements.push(e)
        if (!e.nextElementSibling) break;
        e = e.nextElementSibling as HTMLElement
    }

    let r = ""
    for (const e of elements) {
        fixAllLinks(e, currentPath)
        r += e.outerHTML + "\n"
    }
    return {
        description: r,
        id: id.trim(),
        name: name.trim(),
        points: points ? +points : null,
        titleHtml: titleElement.outerHTML
    }
}

async function loadTask({ url, startElement }: TaskLocation) {
    const r = await fetch(url, { headers: { "Accept": "text/html,application/xhtml+xml" } })
    if (r.status >= 400) {
        throw Error("Bad request")
    }
    const rText = await r.text()
    return parseTask(startElement, rText, url)
}

function virtualTask(id: string): TaskAssignmentData {
    return {
        id,
        description: "úloha je virtuální a neexistuje",
        name: id,
        points: 0,
        titleHtml: "<h3>Virtuální úloha</h3>"
    }
}

export async function grabAssignment(id: string): Promise<TaskAssignmentData> {
    const l = getLocation(id, false)
    if (!l) return virtualTask(id)
    return await loadTask(l)
}

export async function grabSolution(id: string): Promise<TaskAssignmentData> {
    const l = getLocation(id, true)
    if (!l) return virtualTask(id)
    return await loadTask(l)
}
