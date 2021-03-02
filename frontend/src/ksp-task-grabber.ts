import type { TaskDescriptor } from "./tasks"

export type TaskAssignmentData = {
    id: string,
    name: string,
    points: number | null,
    description: string
    hasSolution: boolean
}

type TaskLocation = {
    /** Relative location of HTML file containing this task */
    url: string
    /** id of the element where the specific task begins */
    startElement: string
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

export type ParsedTaskId = {
    rocnik: string
    z: boolean
    serie: string
    uloha: string
}

export function parseTaskId(id: string): ParsedTaskId | null {
    const m = /^(\d+)-(Z?)(\d)-(([A-Z]|\d)+)$/.exec(id)
    if (!m) return null
    const [_, rocnik, z, serie, uloha] = m
    return { rocnik, z: !!z, serie, uloha }
}

function getLocation(id: string, solution: boolean): TaskLocation {
    const parsedId = parseTaskId(id)
    if (!parsedId) {
        throw new Error("Can not parse " + id)
    }
    const { rocnik, z, serie, uloha } = parsedId
    const urlX = solution ? "reseni" : "zadani"
    if (z) {
        return {
            url: `/z/ulohy/${rocnik}/${urlX}${serie}.html`,
            startElement: `task-${id}`
        }
    } else {
        return {
            url: `/h/ulohy/${rocnik}/${urlX}${serie}.html`,
            startElement: `task-${id}`
        }
    }
}

export function getLocationLink(id: string, solution: boolean = false): string {
    const a = getLocation(id, solution);
    return a.url + '#' + a.startElement;
}

function htmlEncode(text: string): string {
    const p = document.createElement("p")
    p.textContent = text
    return p.innerHTML
}

function parseTask(startElementId: string, doc: HTMLDocument): TaskAssignmentData {
    const titleElement = doc.getElementById(startElementId)
    if (!titleElement)
        throw new Error(`Document does not contain ${startElementId}`)
    fixAllLinks(titleElement)

    let e = titleElement

    const titleMatch = /^(\d+-Z?\d+-([A-Z]|\d)+) (.*?)( \((\d+) bod.*\))?$/.exec(e.textContent!.trim())
    if (!titleMatch) {
        var [_, id, name, __, points] = ["", startElementId.startsWith('task-') ? startElementId.substr(5) : startElementId, "Neznámé jméno úlohy", "", ""]
    } else {
        var [_, id, ___,  name, __, points] = titleMatch
    }

    e = e.nextElementSibling as HTMLElement

    // skip first <hr>
    while (e.nextElementSibling &&
           e.tagName.toLowerCase() == "hr")
        e = e.nextElementSibling as HTMLElement


    // hack: remove img tag that shows this task is a practical one. Some tasks have it, some don't, so we remove it for consistency
    const intoImgTag = e.firstElementChild
    if (intoImgTag && intoImgTag.tagName.toLowerCase() == "img" && intoImgTag.classList.contains("leftfloat")) {
        intoImgTag.remove()
    }

    let r = ""

    copyElements: while (!e.classList.contains("story") &&
        //    !e.classList.contains("clearfloat") &&
           e.tagName.toLowerCase() != "h3" &&
           e.textContent!.trim() != "Řešení"
        ) {

        processElement: {
            // hack: remove the paragraph with the matching text. Occurs in KSP-H, but is useless in this context.
            if (e.textContent!.trim().replace(/\s+/g, " ") == "Toto je praktická open-data úloha. V odevzdávacím systému si necháte vygenerovat vstupy a odevzdáte příslušné výstupy. Záleží jen na vás, jak výstupy vyrobíte.") {
                break processElement
            }

            fixAllLinks(e)

            r += e.outerHTML + "\n"
        }

        let n = e.nextSibling
        copyNodes: while(true) {
            if (!n) {
                break copyElements
            }
            if (n.nodeType == Node.ELEMENT_NODE) {
                e = n as HTMLElement
                break copyNodes
            } else if (n.nodeType == Node.TEXT_NODE && n.textContent!.trim() != "") {
                r += htmlEncode(n.textContent!)
            }
            n = n.nextSibling
        }
    }

    return {
        description: r,
        id: id.trim(),
        name: name.trim(),
        points: points ? +points : null,
        hasSolution: true, // TODO: actually detect that
    }
}

export function parseZkpLecture(doc: HTMLDocument) {
    const c = doc.getElementById("content")!
    c.querySelector(".course-heading")!.remove()
    c.querySelector(".course-panel")?.remove()
    c.querySelector(".error")?.remove()

    return c.innerHTML.trim()
}

export async function fetchHtml(url: string) {
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

export function isLoggedIn(): boolean {
    return !!document.head.querySelector("meta[name=x-ksp-uid]")
}

export async function grabAssignment(id: string): Promise<TaskAssignmentData> {
    return await loadTask(getLocation(id, false))
}

export async function grabSolution(id: string): Promise<TaskAssignmentData> {
    return await loadTask(getLocation(id, true))
}

export async function fetchAllTasks(url: string): Promise<TaskAssignmentData[]> {
    const html = await fetchHtml(url)
    return Array.from(html.querySelectorAll("*[id^='task-']"))
                .map(startElement => parseTask(startElement.id, html))
}

type ActiveSeriesModel = { category: "Z" | "H", deadline: string | null | undefined, link: string }

export const getCurrentSeries = (): ActiveSeriesModel[] => Array.from(function* () {
    for (const n of Array.from(document.querySelectorAll("#headnews table tr") as NodeListOf<HTMLTableRowElement>)) {
        if (n.cells.length != 2) { continue }

        const categoryMatch = /^KSP-([ZH])$/.exec(n.cells[0].textContent!)
        const deadline = n.querySelector(".series-deadline")?.textContent
        const link = n.querySelector(".series-link")?.getAttribute("href")
        if (!link || !categoryMatch) { continue }
        
        yield {
            category: categoryMatch[1] as "Z" | "H",
            deadline,
            link
        }
    }
}())

export function loadCurrentTasks(): Promise<TaskDescriptor[]> {
    return Promise.all(getCurrentSeries().map(async f => {

        var tasks = await fetchAllTasks(f.link)
        return tasks.map<TaskDescriptor>(t => ({
            id: t.id,
            title: `${parseTaskId(t.id)!.uloha}: ${t.name}`,
            type: "open-data",
            taskReference: t.id,
            points: t.points || 0,
            requires: []
        }))

    })).then(a => a.flat())
}
