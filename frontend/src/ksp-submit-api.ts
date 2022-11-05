import { fetchHtml, isLoggedIn } from "./ksp-task-grabber";

let apitoken : string | null = null
let apitoken_expiration : number | null = null

type ApiTokenResponse = {
    token: string
    validity_sec: number
}

async function getToken(): Promise<string> {
    if (apitoken_expiration != null) {
        console.assert(apitoken != null)
        const now = performance.now() // monotonic time for measurements
        const margin = 60*1000
        if (now < apitoken_expiration - margin) {
            return apitoken!
        }
    }

    let tokenResponse = await fetch("/api/auth/x-get-token", { method: "POST" })

    if (tokenResponse.status >= 400) {
        const err = await tokenResponse.text()
        throw new Error("User not logged in, failed to get API token: " + err)
    }

    let token = await tokenResponse.json() as ApiTokenResponse
    apitoken = token.token
    apitoken_expiration = performance.now() + token.validity_sec * 1000
    return apitoken
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
