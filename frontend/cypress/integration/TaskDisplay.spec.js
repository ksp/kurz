/// <reference types="cypress" />

const host = "http://ksp-uitest.localhost:5000"
describe('My First Test', () => {
    it('Url changes on navigation', () => {
        cy.visit(host + "/kurz")
        cy.contains("Start")
        cy.contains("Úlohy v kurzu").click()
        cy.url().should('include', '#task/ulohy-v-kurzu')
        cy.contains("Zavřít").click()
        cy.url().should('equal',  host + "/kurz#")
    })
    it('Url change does navigation', () => {
        cy.visit(host + "/kurz#task/start")
        cy.contains("Vítej v novém KSPím kurzu!")
        cy.contains("Zavřít")
        cy.visit(host + "/kurz#task/29-Z1-2")
        cy.contains("29-Z1-2 | 10 bodů")
    })
    it("Images and program links work", () => {
        cy.visit(host + "/kurz#task/32-Z2-2")
        cy.contains("vypište pro každého hada")
        cy.get("img[alt='Znázornění ukázkového příkladu']")
          .scrollIntoView()
          .should("be.visible")
          .and(($img) => {
            // "naturalWidth" and "naturalHeight" are set when the image loads
            expect($img[0].naturalWidth).to.be.greaterThan(0)
          })
    })
})
