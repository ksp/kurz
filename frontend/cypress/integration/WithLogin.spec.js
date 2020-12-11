/// <reference types="cypress" /> 
const host = "http://ksp-uitest.localhost:5000"

function login() {
    cy.visit(host + "/auth/login.cgi")
    cy.get("input[name=login]").type("kokos")
    cy.get("input[name=passwd]").type("kokoskokosny")
    cy.get("input[name=submit]").click()
    cy.visit(host + "/kurz")
}

describe('Functionality with login', () => {
    it('Shows submit form', () => {
        login()
        cy.contains("Turnaj hada").click({force: true})
        cy.contains("32-Z2-2 | 10 bodů")
        cy.contains("Ukázkový vstup:")
        cy.contains("Ukázkový výstup:")
        cy.get("button.download") // can't test file download ;(

        cy.get('.download select')
            .select('první').should('have.value', '1')
            .select('druhý').should('have.value', '2')
            .select('třetí').should('have.value', '3')
            .select('čtvrtý').should('have.value', '4')
            .select('pátý').should('have.value', '5')
            .select('šestý').should('have.value', '6')

        // IDK how to write download tests
        // cy.get('.download select').select("první")
        // cy.get("button.download").click()
    })
    it('Shows task colours', () => {
        login()
        cy.visit(host + "/kurz#task/27-Z1-1")
        cy.contains("27-Z1-1 | 8 bodů | odevzdáno za 0 bodů")
        cy.contains("Zavřít").click()
        cy.get(".submitted.open-data.notSelected").contains("Na zastávce")
    })
})
