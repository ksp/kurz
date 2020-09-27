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

function parseTask(startElementId: string, html: string): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")

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
    return parseTask(startElement, rText)
}

export async function grabAssignment(id: string) {
    const l = getLocation(id, false)
    if (!l) return "úloha je virtuální a neexistuje"
    return await loadTask(l)
}

export async function grabSolution(id: string) {
    const l = getLocation(id, true)
    if (!l) return "úloha je virtuální a neexistuje"
    return await loadTask(l)
}
