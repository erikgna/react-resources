// 05 · Async — retry-ability, cy.clock(), cy.tick(), explicit waits

describe('05 — retry-ability (auto-waiting)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('5 · Async').click()
  })

  it('waits for delayed element without explicit wait', () => {
    // DelayedMessage has 1500ms delay — Cypress retries up to 4s
    cy.get('[data-cy=delayed-msg]').should('be.visible').and('have.text', 'Loaded!')
  })

  it('placeholder disappears once message loads', () => {
    cy.get('[data-cy=delayed-placeholder]').should('exist')
    cy.get('[data-cy=delayed-msg]').should('be.visible')
    cy.get('[data-cy=delayed-placeholder]').should('not.exist')
  })
})

describe('05 — cy.clock() + cy.tick()', () => {
  it('skips 1500ms delay instantly', () => {
    cy.clock()
    cy.visit('http://localhost:5173')
    cy.contains('5 · Async').click()

    cy.get('[data-cy=delayed-placeholder]').should('exist')
    cy.tick(1500)
    cy.get('[data-cy=delayed-msg]').should('be.visible')
  })

  it('controls setInterval ticks precisely', () => {
    cy.clock()
    cy.visit('http://localhost:5173')
    cy.contains('5 · Async').click()

    cy.get('[data-cy=tick-count]').should('have.text', 'ticks: 0')
    cy.tick(500)
    cy.get('[data-cy=tick-count]').should('have.text', 'ticks: 1')
    cy.tick(500)
    cy.get('[data-cy=tick-count]').should('have.text', 'ticks: 2')
    cy.tick(1000)
    cy.get('[data-cy=tick-count]').should('have.text', 'ticks: 4')
  })
})

describe('05 — animation phases with cy.clock()', () => {
  it('asserts on intermediate animation phase', () => {
    cy.clock()
    cy.visit('http://localhost:5173')
    cy.contains('5 · Async').click()

    cy.get('[data-cy=animation-phase]').should('have.text', 'idle')
    cy.get('[data-cy=start-animation]').click()
    cy.get('[data-cy=animation-phase]').should('have.text', 'enter')

    cy.tick(800)
    cy.get('[data-cy=animation-phase]').should('have.text', 'done')
  })
})

describe('05 — cy.wait() with network alias', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('4 · Network').click()
  })

  it('blocks on network request before asserting', () => {
    cy.intercept('GET', '/api/users', [{ id: 1, name: 'Alice', email: 'a@b.com' }]).as('getUsers')

    cy.get('[data-cy=load-btn]').click()
    cy.wait('@getUsers')                              // explicit wait for network
    cy.get('[data-cy=user-list] li').should('have.length', 1)
  })

  it('inspect interception object after cy.wait()', () => {
    cy.intercept('GET', '/api/users', []).as('getUsers')

    cy.get('[data-cy=load-btn]').click()
    cy.wait('@getUsers').then(interception => {
      expect(interception.request.url).to.include('/api/users')
      expect(interception.response?.statusCode).to.eq(200)
    })
  })
})
