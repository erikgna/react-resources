// 01 · Selectors — cy.get(), cy.contains(), .find(), .within(), .eq()
// Visit tab 1 in the browser demo to see the components these specs target.

describe('01 — data-cy selectors', () => {
  beforeEach(() => cy.visit('http://localhost:5173'))

  it('finds element by data-cy attribute', () => {
    // Navigate to selectors tab
    cy.contains('1 · Selectors').click()
    cy.get('[data-cy=user-card]').should('exist')
  })

  it('finds edit button within scoped card', () => {
    cy.contains('1 · Selectors').click()
    cy.get('[data-cy=user-list]')
      .find('[data-cy=user-card]').first()
      .within(() => {
        cy.get('[data-cy=edit-btn]').should('exist')
      })
  })

  it('finds delete button by aria-label', () => {
    cy.contains('1 · Selectors').click()
    cy.get('[aria-label="Delete Alice"]').should('exist')
  })
})

describe('01 — cy.contains()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('1 · Selectors').click()
  })

  it('finds button by text', () => {
    cy.contains('Confirm').should('exist')
    cy.contains('Cancel').should('exist')
  })

  it('scopes contains() to parent element', () => {
    cy.get('[data-cy=navbar]').contains('Users').should('exist')
  })

  it('shows result text after click', () => {
    cy.contains('Confirm').click()
    cy.get('[data-cy=result]').should('have.text', 'confirmed')

    cy.contains('Cancel').click()
    cy.get('[data-cy=result]').should('have.text', 'cancelled')
  })
})

describe('01 — .within() scoping', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('1 · Selectors').click()
  })

  it('multiple edit buttons — within() disambiguates', () => {
    // 3 user cards each have an edit-btn — cy.get('[data-cy=edit-btn]') returns 3
    cy.get('[data-cy=edit-btn]').should('have.length', 3)

    // Within the first card (Alice), get the specific edit button
    cy.get('[data-cy=user-card]').first().within(() => {
      cy.get('[data-cy=edit-btn]').should('have.length', 1)
    })
  })

  it('.eq() selects nth element (0-indexed)', () => {
    cy.get('[data-cy=user-name]').eq(0).should('have.text', 'Alice')
    cy.get('[data-cy=user-name]').eq(1).should('have.text', 'Bob')
    cy.get('[data-cy=user-name]').eq(2).should('have.text', 'Carol')
  })
})

describe('01 — status badge assertions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('1 · Selectors').click()
  })

  it('active users have correct status', () => {
    cy.get('[data-cy=user-status]').first().should('have.text', 'active')
  })

  it('inactive user has correct status', () => {
    // Bob is the middle card — index 1
    cy.get('[data-cy=user-card]').eq(1).within(() => {
      cy.get('[data-cy=user-status]').should('have.text', 'inactive')
    })
  })
})
