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

jest.setTimeout(12_000)

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

describe('all tasks in a page', () => {
    test('all assignments', async () => {
        const tasks = await g.fetchAllTasks("/h/ulohy/33/zadani3.html")
        expect(tasks.map(x => x.id)).toStrictEqual([ "33-3-1", "33-3-2", "33-3-3", "33-3-4", "33-3-X1", "33-3-S" ])
    })
    test('all solutions', async () => {
        const tasks = await g.fetchAllTasks("/h/ulohy/33/reseni1.html")
        expect(tasks.map(x => x.id)).toStrictEqual([ "33-1-1", "33-1-2", "33-1-3", "33-1-4", "33-1-X1" ])
    })
})

describe('current series scraping', () => {
    
    test("1 series with deadline", () => {
        document.body.innerHTML = `<div id='header'>
        <div id='logo'>
            <h1><a href='/'>KSP</a></h1>
            <h2><a href='/'>Korespondenční seminář z programování</a></h2>
        </div>
        <div id='menu'>
            <ul>
                <li class='active'><a class='home' href='/'>Domů</a>
                <li><a href='/h/'>KSP-H</a>
                <li><a href='/z/'>KSP-Z</a>
                <li><a href='/kucharky/'>Kuchařky</a>
                <li><a href='/encyklopedie/'>Encyklopedie</a>
                <li><a href='/sksp/'>Soustředění</a>
                <li><a href='/akce/'>Ostatní</a>
                <li><a href='/kontakty/'>Kontakty</a>
            </ul>
        </div>
        <div id='headnews'>
            <h3>Aktuálně</h3>
            <table>
                <tr><th>KSP-H<td><a href='/h/ulohy/33/vysledky2.html'>2. série opravena</a>, <a class='series-link' href='/h/ulohy/33/zadani3.html'>3. sérii</a> odevzdávejte do <span class='series-deadline' style='border-bottom: 1px dotted' title='lze odevzdávat až do rána dalšího dne v 8:00'>21. 2. 2022</span>
                <tr><th>KSP-Z<td><a href='/z/ulohy/33/zadani3.html'>3. série se opravuje</a>
                
            </table>
            <hr>
            <div class='auth'>
                <p><span class='login_label'>Nepřihlášen:</span> <a href='https://localhost:1443/auth/login.cgi?redirect=https%3a%2f%2flocalhost%3a1443%2f'>Přihlásit</a><span class='splitter'>|</span><a href='/auth/manage.cgi?mode=register'>Registrovat</a></p>
            </div>
        </div>
    </div>`

        expect(g.getCurrentSeries()).toStrictEqual([{ category: "H", deadline: "21. 2. 2022", link: "/h/ulohy/33/zadani3.html" }])
    })

    test("no active series", () => {
        document.body.innerHTML = `<div id='header'>
        <div id='logo'>
            <h1><a href='/'>KSP</a></h1>
            <h2><a href='/'>Korespondenční seminář z programování</a></h2>
        </div>
        <div id='menu'>
            <ul>
                <li class='active'><a class='home' href='/'>Domů</a>
                <li><a href='/h/'>KSP-H</a>
                <li><a href='/z/'>KSP-Z</a>
                <li><a href='/kucharky/'>Kuchařky</a>
                <li><a href='/encyklopedie/'>Encyklopedie</a>
                <li><a href='/sksp/'>Soustředění</a>
                <li><a href='/akce/'>Ostatní</a>
                <li><a href='/kontakty/'>Kontakty</a>
            </ul>
        </div>
        <div id='headnews'>
            <h3>Aktuálně</h3>
            <table>
                <tr><th>KSP-H<td><a href='/h/ulohy/33/zadani3.html'>3. série se opravuje</a>
                <tr><th>KSP-Z<td><a href='/z/ulohy/33/reseni3.html'>3. série se opravuje</a>
                
            </table>
            <hr>
            <div class='auth'>
                <p><span class='login_label'>Nepřihlášen:</span> <a href='/auth/login.cgi?redirect=https%3a%2f%2fksp.mff.cuni.cz%2f'>Přihlásit</a><span class='splitter'>|</span><a href='/auth/manage.cgi?mode=register'>Registrovat</a></p>
            </div>
        </div>
    </div>`

        expect(g.getCurrentSeries()).toStrictEqual([])
    })
    test("2 active series", () => {
        document.body.innerHTML = `<div id='wrapper'>
        <div id='header'>
            <div id='logo'>
                <h1><a href='/'>KSP</a></h1>
                <h2><a href='/'>Korespondenční seminář z programování</a></h2>
            </div>
            <div id='menu'>
                <ul>
                    <li class='active'><a class='home' href='/'>Domů</a>
                    <li><a href='/h/'>KSP-H</a>
                    <li><a href='/z/'>KSP-Z</a>
                    <li><a href='/kucharky/'>Kuchařky</a>
                    <li><a href='/encyklopedie/'>Encyklopedie</a>
                    <li><a href='/sksp/'>Soustředění</a>
                    <li><a href='/akce/'>Ostatní</a>
                    <li><a href='/kontakty/'>Kontakty</a>
                </ul>
            </div>
            <div id='headnews'>
                <h3>Aktuálně</h3>
                <table>
                    <tr><th>KSP-H<td><a href='/h/ulohy/33/vysledky2.html'>2. série opravena</a>, <a class='series-link' href='/h/ulohy/33/zadani3.html'>3. sérii</a> odevzdávejte do <span class='series-deadline' style='border-bottom: 1px dotted' title='lze odevzdávat až do rána dalšího dne v 8:00'>21. 2. 2022</span>
                    <tr><th>KSP-Z<td><a href='/z/ulohy/33/vysledky2.html'>2. série opravena</a>, <a class='series-link' href='/z/ulohy/33/zadani3.html'>3. sérii</a> odevzdávejte do <span class='series-deadline' style='border-bottom: 1px dotted' title='lze odevzdávat až do rána dalšího dne v 8:00'>14. 2. 2022</span>
                    
                </table>
                <hr>
                <div class='auth'>
                    <p><span class='login_label'>Nepřihlášen:</span> <a href='https://localhost:1443/auth/login.cgi?redirect=https%3a%2f%2flocalhost%3a1443%2f'>Přihlásit</a><span class='splitter'>|</span><a href='/auth/manage.cgi?mode=register'>Registrovat</a></p>
                </div>
            </div>
        </div>`

        expect(g.getCurrentSeries()).toStrictEqual([
            { category: "H", deadline: "21. 2. 2022", link: "/h/ulohy/33/zadani3.html" },
            { category: "Z", deadline: "14. 2. 2022", link: "/z/ulohy/33/zadani3.html" },
        ])
    })
})
