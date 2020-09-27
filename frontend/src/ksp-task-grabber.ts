export type TaskAssignmentData = {
    id: string,
    name: string,
    points: number,
    description: HTMLElement
}

type TaskLocation = {
    /** Relative location of HTML file containing this task */
    url: string
    /** id of the element where the specific task begins */
    startElement: string
}

function getLocation(id: string, solution: boolean): TaskLocation {
    const m = /^(\d+)-(Z?)(\d)-(\d)$/.exec(id)
    if (!m) throw new Error(`Invalid task id: ${m}`)
    const [_, rocnik, z, serie, uloha] = m[1]
    if (z == 'Z') {
        const urlX = solution ? "reseni" : "zadani"
        return {
            url: `z/ulohy/${rocnik}/${urlX}${serie}.html`,
            startElement: `task${uloha}`
        }
    } else {
        const urlX = solution ? "solution" : "tasks"
        return {
            url: `tasks/${rocnik}/${urlX}${serie}.html`,
            startElement: `task${uloha}`
        }
    }
}

function parseTask(startElementId: string, html: string, contentType: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, contentType as any)

    const titleElement = doc.getElementById(startElementId)
    if (!titleElement)
        throw new Error(`Document does not contain ${startElementId}`)
    const elements = []

    let e = titleElement

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
    for (const e of elements)
        r += e.outerHTML + "\n"
    return r
}

async function loadTask({ url, startElement }: TaskLocation) {
    const r = await fetch(url, { headers: { "Accept": "text/html,application/xhtml+xml" } })
    if (r.status >= 400) {
        throw Error("Bad request")
    }
    const rText = await r.text()
    const contentType = r.headers.get("Content-Type") || "text/html"
    return parseTask(startElement, rText, contentType)
}

export function loadAssignment(id: string) {
    return loadTask(getLocation(id, false))
}

export function loadSolution(id: string) {
    return loadTask(getLocation(id, true))
}
