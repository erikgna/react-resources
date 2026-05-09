// 04 · Network — cy.intercept(), .as(), cy.wait(), cy.fixture()

describe('04 — cy.intercept() stub GET', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('4 · Network').click()
  })

  it('stubs GET /api/users and renders list', () => {
    cy.intercept('GET', '/api/users', [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob',   email: 'bob@example.com'   },
    ]).as('getUsers')

    cy.get('[data-cy=load-btn]').click()
    cy.wait('@getUsers')

    cy.get('[data-cy=user-list] li').should('have.length', 2)
    cy.get('[data-cy=user-1] [data-cy=user-name]').should('have.text', 'Alice')
    cy.get('[data-cy=user-2] [data-cy=user-name]').should('have.text', 'Bob')
  })

  it('shows loading spinner before response arrives', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.reply({ delay: 1000, body: [] })
    }).as('getUsers')

    cy.get('[data-cy=load-btn]').click()
    cy.get('[data-cy=loading-spinner]').should('be.visible')
    cy.wait('@getUsers')
  })
})

describe('04 — error states via intercept', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('4 · Network').click()
  })

  it('shows error UI on 500 response', () => {
    cy.intercept('GET', '/api/users', { statusCode: 500, body: { error: 'server error' } })

    cy.get('[data-cy=load-btn]').click()
    cy.get('[data-cy=error-msg]').should('be.visible').and('have.text', 'Failed to load users')
    cy.get('[data-cy=user-list] li').should('have.length', 0)
  })

  it('shows error UI on network failure', () => {
    cy.intercept('GET', '/api/users', { forceNetworkError: true })

    cy.get('[data-cy=load-btn]').click()
    cy.get('[data-cy=error-msg]').should('be.visible')
  })
})

describe('04 — spy on POST request body', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('4 · Network').click()
  })

  it('verifies POST request body without stubbing response', () => {
    cy.intercept('POST', '/api/posts').as('createPost')

    cy.get('[data-cy=title-input]').type('Hello World')
    cy.get('[data-cy=submit-btn]').click()

    cy.wait('@createPost').its('request.body').should('deep.equal', { title: 'Hello World' })
  })

  it('verifies content-type header on POST', () => {
    cy.intercept('POST', '/api/posts').as('createPost')

    cy.get('[data-cy=title-input]').type('Test')
    cy.get('[data-cy=submit-btn]').click()

    cy.wait('@createPost').its('request.headers')
      .should('have.property', 'content-type')
      .and('include', 'application/json')
  })
})

describe('04 — cy.fixture()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('4 · Network').click()
  })

  it('loads fixture data and renders users', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users', users).as('getUsers')
    })

    cy.get('[data-cy=load-btn]').click()
    cy.wait('@getUsers')
    cy.get('[data-cy=user-list] li').should('have.length', 3)
  })

  it('loads fixture via shorthand', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users' }).as('getUsers')

    cy.get('[data-cy=load-btn]').click()
    cy.wait('@getUsers')
    cy.get('[data-cy=user-1] [data-cy=user-name]').should('have.text', 'Alice')
  })
})
