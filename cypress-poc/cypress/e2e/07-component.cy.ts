// 07 · Component mode concepts — this E2E spec covers the browser demo tab.
// The actual component specs are in src/experiments/07-component/component.cy.tsx
// and run via: npm run cy:component

describe('07 — component tab renders', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('7 · Component').click()
  })

  it('shows all button variants in demo', () => {
    cy.contains('Default').should('be.visible')
    cy.contains('Primary').should('be.visible')
    cy.contains('Danger').should('be.visible')
    cy.contains('Disabled').should('be.visible')
  })

  it('shows accordion demo', () => {
    cy.get('[data-cy=accordion-trigger]').should('exist')
    cy.get('[data-cy=accordion-trigger]').should('have.attr', 'aria-expanded', 'false')
  })

  it('accordion opens and closes', () => {
    cy.get('[data-cy=accordion-trigger]').click()
    cy.get('[data-cy=accordion-trigger]').should('have.attr', 'aria-expanded', 'true')
    cy.get('[data-cy=accordion-content]').should('be.visible')

    cy.get('[data-cy=accordion-trigger]').click()
    cy.get('[data-cy=accordion-content]').should('not.exist')
  })

  it('theme box shows dark theme by default', () => {
    cy.get('[data-cy=theme-box]').should('have.attr', 'data-theme', 'dark')
  })
})
