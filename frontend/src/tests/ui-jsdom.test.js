const { readFileSync, readdirSync } = require('fs');
const { resolve } = require('path');
const TaskPanel = require('../TaskPanel.svelte').default


const node_fetch = require('node-fetch')

const delay = (time=10) => new Promise((resolve) => window.setTimeout(resolve, time))
const allPromises = []

global.fetch = function(url, init) {
    const p = node_fetch(new URL(url, "https://ksp.mff.cuni.cz").href, init)
    allPromises.push(p)
    return p
}

const tasks_json = readFileSync("../tasks.json").toString()
const tasks = JSON.parse(tasks_json)

test("TaskPanel - display", async () => {
    allPromises.length = 0

    const element = document.createElement("div")
    const tp = new TaskPanel({
        target: element,
        props: { tasks, selectedTaskId: "26-Z1-1" }
    })
    await Promise.all(allPromises)
    await delay()
    expect(element.querySelector("h3").textContent).toEqual("Kevin a magnety")
    expect(element.querySelector(".leftfloat pre").textContent.trim()).toEqual("4\n+-\n+-\n-+\n+-")
    expect(element.querySelector(".status").textContent.trim()).toEqual("26-Z1-1 | 8 bodů")
    expect(element.textContent).toContain("Pro odevzdávání je potřeba se přihlásit.")
})

test("TaskPanel - solution", async () => {
    allPromises.length = 0

    const element = document.createElement("div")
    const tp = new TaskPanel({
        target: element,
        props: { tasks, selectedTaskId: "26-Z1-1" }
    })
    await Promise.all(allPromises)
    await delay()

    const showSolution = element.querySelector(".solution a")
    expect(showSolution).toBeTruthy()
    showSolution.click()
    await delay()

    const sol = element.querySelector(".solution")
    expect(sol.textContent).toContain("opravdu si chceš vyzradit řešení?")
    sol.querySelector("p").remove()
    const result = eval(sol.textContent.replace("=", ""))
    const input = sol.querySelector("input")

    input.value = result + 1
    input.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true
    }))
    await delay()

    expect(element.querySelector(".solution input")).toBe(input)
    expect(element.querySelector(".solution").textContent).not.toContain("Načítám")


    input.value = result
    input.dispatchEvent(new Event('input', {
        bubbles: true,
        cancelable: true
    }))
    await delay()
    expect(element.querySelector(".solution input")).toBeFalsy()
    expect(element.querySelector(".solution").textContent).toContain("Načítám")
    await Promise.all(allPromises)
    await delay()

    expect(sol.textContent).toContain("Magnety se přitahují tehdy, když mají naproti sobě opačné póly,")
    expect(sol.textContent).toContain("Program (C)")

    tp.$set({ selectedTaskId: "32-Z2-2" })
    await delay()
    await Promise.all(allPromises)
    await delay()
    // check that solution is not displayed
    expect(element.querySelector(".solution").textContent.trim()).toEqual("Zobrazit řešení úlohy")

    tp.$set({ selectedTaskId: "kucharka-zakladni-pole" })
    await delay()
    await Promise.all(allPromises)
    await delay()
    // solution does not make sense
    expect(element.querySelector(".solution")).toBeNull()
})
