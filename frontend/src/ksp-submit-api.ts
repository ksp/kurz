import { fetchHtml, isLoggedIn } from "./ksp-task-grabber";

let apitoken : string | null = null

async function getToken(): Promise<string | undefined> {
    if (apitoken != null) {
        return apitoken
    }
    let doc = await fetchHtml("/auth/apitoken.cgi?show=1")
    const token = Array.from(doc.querySelectorAll("#content p")).map(x => /Aktuální token: (.*)/.exec(x.innerHTML.trim())).filter(x => x != null).map(x => x![1])[0]
    if (token) {
        return apitoken = token;
    }
    const form = doc.getElementById("apitoken") as HTMLFormElement
    const op = (form.elements.namedItem("op") as HTMLInputElement).value
    const submit = (form.elements.namedItem("submit") as HTMLInputElement).value
    const csrfToken = (form.elements.namedItem("_token") as HTMLInputElement).value
    const body = `op=${encodeURIComponent(op)}&submit=${encodeURIComponent(submit)}&_token=${encodeURIComponent(csrfToken)}`
    console.log(`Creating new API token`)
    await fetch("/auth/apitoken.cgi", { method: "POST", body, headers: [["Content-Type", "application/x-www-form-urlencoded"]], redirect: "manual" })
    return await getToken()
}


async function request(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getToken()
    const headers = new Headers(options.headers)
    headers.append("Authorization", "Bearer " + token)
    const opts:  RequestInit = { ...options, headers, credentials: "omit" }
    const r = await fetch(url, opts)
    if (r.status >= 400) {
        throw await r.json()
    }
    return r
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const r = await request(url, options)
    return await r.json()
}

export function listTasks(): Promise<string[]> {
    return requestJson("/api/tasks/list?set=cviciste")
}

export type SubtaskSubmitStatus = {
    id: string
    points: number
    max_points: number
    input_generated: boolean
    input_valid_until?: string
    submitted_on?: string
    verdict?: string
    download_url?: string
}

export type TaskSubmitStatus = {
    id: string
    name: string
    points: number
    max_points: number
    subtasks: SubtaskSubmitStatus[]
}

export function taskStatus(id: string): Promise<TaskSubmitStatus> {
    return requestJson(`/api/tasks/status?task=${encodeURIComponent(id)}`)
}

export function generateInput(id: string, subtask: string): Promise<SubtaskSubmitStatus> {
    return requestJson(`/api/tasks/generate?task=${encodeURIComponent(id)}&subtask=${encodeURIComponent(subtask)}`, { method: "POST" })
}

export async function getInput(id: string, subtask: string): Promise<Blob> {
    const r = await request(`/api/tasks/input?task=${encodeURIComponent(id)}&subtask=${encodeURIComponent(subtask)}`)
    return await r.blob()
}

export async function submit(id: string, subtask: string, uploadedData: string | Blob): Promise<SubtaskSubmitStatus> {
    return requestJson(
        `/api/tasks/submit?task=${encodeURIComponent(id)}&subtask=${encodeURIComponent(subtask)}`,
        {
            method: "POST",
            body: uploadedData,
            headers: [
                ["Content-Type", "text/plain"]
            ]
        })
}
export type TaskStatus = {
    id: string
    name: string
    submitted: boolean
    solved: boolean
    points: number
    maxPoints: number
}

export async function grabTaskSummary(): Promise<Map<string, TaskStatus>> {
    if (!isLoggedIn()) throw new Error()

    const results = await requestJson(`/api/tasks/x-summary`) as { tasks: TaskSubmitStatus[] }

    function mapId(id: string) {
        if (id.startsWith("cviciste/"))
            return id.substr("cviciste/".length)
        else
            return id
    }

    return new Map<string, TaskStatus>(
        results.tasks.map(r => [mapId(r.id), { id: r.id, maxPoints: r.max_points, name: r.name, points: r.points ?? 0, solved: r.points > r.max_points - 0.001, submitted: r.points != null }])
    )
}
