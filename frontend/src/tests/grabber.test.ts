import * as g from '../ksp-task-grabber'
import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import type { TaskDescriptor, TasksFile } from '../tasks';

const node_fetch: any = require('node-fetch')

global.fetch = function(url: string, init: any) {
    return node_fetch(new URL(url, "https://ksp.mff.cuni.cz").href, init)
} as any

const tasks_json = readFileSync("../tasks.json").toString()
const tasks: TasksFile = JSON.parse(tasks_json)


describe('tasks.json validation', () => {
    test("unique ids", () => {
        const allIds = tasks.tasks.map(t => t.id)
        // no duplicate ids
        expect(allIds).toStrictEqual(Array.from(new Set(allIds).keys()))
    })

    for (const t of tasks.tasks) {
        test(`'${t.id}' is valid`, () => {
            expect(t.id).not.toBe("")
            expect(typeof t.id).toBe("string")
            expect(t.title).toBeTruthy()
            expect(t.position).toBeDefined()
            expect(["open-data", "text", "label", "custom-open-data"]).toContain(t.type)
            if (t.type == "text") {
                expect(t.htmlContent?.trim()).toBeTruthy()
                if (!t.hidden) {
                    expect(t.htmlContent).not.toContain("FIXME")
                    expect(t.htmlContent).not.toContain("TODO")
                }
            } else if (t.type == "open-data") {
                expect(t.taskReference).toBeTruthy()
                expect(g.parseTaskId(t.taskReference)).toBeTruthy()
            } else if (t.type == "custom-open-data") {
                expect(t.taskReference).toBeTruthy()
                expect(t.title).toBeTruthy()
                if (!t.hidden) {
                    expect(t.htmlAssignment).not.toContain("FIXME")
                    expect(t.htmlAssignment).not.toContain("TODO")
                    if (t.htmlSolution) {
                        expect(t.htmlSolution).not.toContain("FIXME")
                        expect(t.htmlSolution).not.toContain("TODO")
                    }
                }
            }
        })
    }
})

describe('tasks assignment', () => {
    for (const t of tasks.tasks) {
        if (t.type != "open-data") continue;

        test.concurrent(`${t.id}`, async () => {
            const assignment = await g.grabAssignment(t.taskReference)
            expect(t.taskReference).toEqual(assignment.id)
            expect(assignment.points).toBeGreaterThanOrEqual(1)
            expect(assignment.description.trim()).toBeTruthy()
            expect(assignment.name.trim()).toBeTruthy()
            expect(assignment.points).toBe(t.points)
        })
    }
})

describe('tasks solutions', () => {
    const refs = tasks.tasks.filter(x => x.type == "open-data")
                            .map(x => g.parseTaskId((x as any).taskReference)!)
    const lastSeriesZ = Math.max(... refs.filter(t =>  t.z).map(x => 10 * +x.rocnik + +x.serie))
    const lastSeriesH = Math.max(... refs.filter(t => !t.z).map(x => 10 * +x.rocnik + +x.serie))
    for (const t of tasks.tasks) {
        if (t.type != "open-data") {
            continue
        }

        const parsed = g.parseTaskId(t.taskReference)!
        if (10 * +parsed.rocnik + +parsed.serie >= (parsed.z ? lastSeriesZ : lastSeriesH)) {
            continue
        }

        test.concurrent(`${t.id}`, async () => {
            const sol = await g.grabSolution(t.taskReference)
            expect(t.taskReference).toEqual(sol.id)
            expect(sol.description.trim()).toBeTruthy()
            expect(sol.name.trim()).toBeTruthy()
        })
    }
})

describe('task assignment (exact match)', () => {
    const assignmentDir = resolve(__dirname, "example_assignments")
    const assignmentFiles = readdirSync(assignmentDir)
    for (const a of assignmentFiles) {
        const [_, id] = /(.*?)\.html/.exec(a)!
        test.concurrent(id, async () => {
            const assignment = await g.grabAssignment(id)
            const expected = readFileSync(resolve(assignmentDir, a)).toString()
            try {
                expect(assignment.description.trim()).toEqual(expected.trim())
            } catch(e) {
                console.warn(assignment.description)
                throw e
            }
        })
    }
})
describe('task solution (exact match)', () => {
    const assignmentDir = resolve(__dirname, "example_solutions")
    const assignmentFiles = readdirSync(assignmentDir)
    for (const a of assignmentFiles) {
        const [_, id] = /(.*?)\.html/.exec(a)!
        test.concurrent(id, async () => {
            const solution = await g.grabSolution(id)
            const expected = readFileSync(resolve(assignmentDir, a)).toString()
            try {
                expect(solution.description.trim()).toEqual(expected.trim())
            } catch(e) {
                console.log(solution.description)
                throw e
            }
        })
    }
})
