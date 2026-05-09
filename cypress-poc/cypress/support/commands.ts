// Custom cy commands shared across E2E specs

// Example: cy.dataCy('submit-btn') → cy.get('[data-cy=submit-btn]')
Cypress.Commands.add('dataCy', (selector: string) => {
  return cy.get(`[data-cy=${selector}]`)
})

declare global {
  namespace Cypress {
    interface Chainable {
      dataCy(selector: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
