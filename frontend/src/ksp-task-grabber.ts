import type { TaskId } from "./graph-types"

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

export type TaskStatus = {
    id: string
    name: string
    submitted: boolean
    solved: boolean
    points: number
    maxPoints: number
    type: string
}

function fixAllLinks(e: any) {
    if (typeof e.src == "string") {
        e.src = e.src
    }
    if (typeof e.href == "string") {
        e.href = e.href
    }
    let c = (e as HTMLElement).firstElementChild
    while (c) {
        fixAllLinks(c)
        c = c.nextElementSibling
    }
}

type ParsedTaskId = {
    rocnik: string
    z: boolean
    serie: string
    uloha: string
}

function parseTaskId(id: string): ParsedTaskId | null {
    const m = /^(\d+)-(Z?)(\d)-(\d)$/.exec(id)
    if (!m) return null
    const [_, rocnik, z, serie, uloha] = m
    return { rocnik, z: !!z, serie, uloha }
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

function parseTask(startElementId: string, doc: HTMLDocument): TaskAssignmentData {
    const titleElement = doc.getElementById(startElementId)
    if (!titleElement)
        throw new Error(`Document does not contain ${startElementId}`)
    fixAllLinks(titleElement)
    const elements = []

    let e = titleElement

    const titleMatch = /^(\d+-Z?\d+-\d+) (.*?)( \((\d+) bod.*\))?$/.exec(e.innerText.trim())
    if (!titleMatch) {
        var [_, id, name, __, points] = ["", startElementId, "Neznámé jméno úlohy", "", ""]
    } else {
        var [_, id, name, __, points] = titleMatch
    }

    e = e.nextElementSibling as HTMLElement

    while (e.nextElementSibling &&
           e.tagName.toLowerCase() == "hr")
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
        fixAllLinks(e)
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

function parseTaskStatuses(doc: HTMLDocument): TaskStatus[] {
    const rows = Array.from(doc.querySelectorAll("table.zs-tasklist tr")).slice(1) as HTMLTableRowElement[]
    return rows.map(r => {
        const submitted = !r.classList.contains("zs-unsubmitted")
        const id = r.cells[0].innerText.trim()
        const type = r.cells[1].innerText.trim()
        const name = r.cells[2].innerText.trim()
        const pointsStr = r.cells[4].innerText.trim()
        const pointsMatch = /((–|\.|\d)+) *\/ *(\d+)/.exec(pointsStr)
        if (!pointsMatch) throw new Error()
        const points = +pointsMatch[1]
        const maxPoints = +pointsMatch[2]
        const solved = r.classList.contains("zs-submitted")
        return { id, name, submitted, type, points, maxPoints, solved }
    })
}

async function fetchHtml(url: string) {
    const r = await fetch(url, { headers: { "Accept": "text/html,application/xhtml+xml" } })
    if (r.status >= 400) {
        throw Error(r.statusText)
    }
    const html = await r.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    if (!doc.head.querySelector("base")) {
        let baseEl = doc.createElement('base');
        baseEl.setAttribute('href', new URL(url, location.href).href);
        doc.head.append(baseEl);
    }
    return doc
}

async function loadTask({ url, startElement }: TaskLocation): Promise<TaskAssignmentData> {
    const html = await fetchHtml(url)
    return parseTask(startElement, html)
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

export function isLoggedIn(): boolean {
    return !!document.querySelector(".auth a[href='/profil/profil.cgi']")
}

export async function grabTaskStates(kspIds: string[]): Promise<Map<string, TaskStatus>> {
    if (!isLoggedIn()) throw new Error()

    const ids = new Set<string>(kspIds.map(parseTaskId).filter(t => t != null).map(t => t!.rocnik))
    const results = await Promise.all(Array.from(ids.keys()).map(async (rocnik) => {
        const html = await fetchHtml(`/cviciste/?year=${rocnik}`)
        return parseTaskStatuses(html)
    }))

    return new Map<string, TaskStatus>(
        ([] as TaskStatus[]).concat(...results)
        .map(r => [r.id, r])
    )
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
