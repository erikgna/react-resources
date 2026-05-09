// 08 · Failures — error boundary, network errors, race conditions, flakiness patterns

describe('08 — failures tab renders', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('8 · Failures').click()
  })

  it('network error UI renders trigger button', () => {
    cy.get('[data-cy=trigger-btn]').should('exist')
    cy.get('[data-cy=error-state]').should('not.exist')
  })
})

describe('08 — network error state', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('8 · Failures').click()
  })

  it('shows error state on network failure', () => {
    cy.intercept('GET', '/api/broken', { forceNetworkError: true })
    cy.get('[data-cy=trigger-btn]').click()
    cy.get('[data-cy=error-state]').should('be.visible').and('have.text', 'Request failed')
  })

  it('shows error state on 404', () => {
    cy.intercept('GET', '/api/broken', { statusCode: 404 })
    cy.get('[data-cy=trigger-btn]').click()
    cy.get('[data-cy=error-state]').should('be.visible')
  })
})

describe('08 — race condition with cy.clock()', () => {
  it('controls which timer fires first', () => {
    cy.clock()
    cy.visit('http://localhost:5173')
    cy.contains('8 · Failures').click()

    cy.get('[data-cy=race-result]').should('have.text', '')
    cy.get('[data-cy=race-btn]').click()

    // Only fast timer (100ms) fires
    cy.tick(100)
    cy.get('[data-cy=race-result]').should('have.text', 'fast')

    // Now slow timer (300ms total) fires
    cy.tick(200)
    cy.get('[data-cy=race-result]').should('have.text', 'slow')
  })
})

describe('08 — uncaught exception handling', () => {
  it('prevents test failure from React render error', () => {
    // Suppress the React error so Cypress doesn't fail the test
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Intentional render error')) return false
    })

    cy.visit('http://localhost:5173')
    cy.contains('8 · Failures').click()
    // Page still loads even with the exception handler in place
    cy.get('[data-cy=trigger-btn]').should('exist')
  })
})
