// 06 · Forms — validation flow, accessibility, submit spying

describe('06 — empty form validation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('6 · Forms').click()
  })

  it('shows all errors on empty submit', () => {
    cy.get('[data-cy=submit-btn]').click()
    cy.get('[data-cy=name-error]').should('have.text', 'Name is required')
    cy.get('[data-cy=email-error]').should('have.text', 'Invalid email')
    cy.get('[data-cy=agree-error]').should('have.text', 'You must agree')
  })

  it('marks invalid fields with aria-invalid', () => {
    cy.get('[data-cy=submit-btn]').click()
    cy.get('[data-cy=name-input]').should('have.attr', 'aria-invalid', 'true')
    cy.get('[data-cy=email-input]').should('have.attr', 'aria-invalid', 'true')
  })

  it('error messages have role=alert for screen readers', () => {
    cy.get('[data-cy=submit-btn]').click()
    cy.get('[role=alert]').should('have.length', 3)
  })
})

describe('06 — successful registration flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('6 · Forms').click()
  })

  it('completes registration and shows success banner', () => {
    cy.get('[data-cy=name-input]').type('Alice')
    cy.get('[data-cy=email-input]').type('alice@example.com')
    cy.get('[data-cy=role-select]').select('admin')
    cy.get('[data-cy=agree-checkbox]').check()
    cy.get('[data-cy=submit-btn]').click()

    cy.get('[data-cy=success-banner]')
      .should('be.visible')
      .and('contain.text', 'Alice')
  })

  it('errors disappear after fixing the field', () => {
    // Trigger name error
    cy.get('[data-cy=submit-btn]').click()
    cy.get('[data-cy=name-error]').should('exist')

    // Fix name — re-submit to check other errors
    cy.get('[data-cy=name-input]').type('Bob')
    cy.get('[data-cy=email-input]').type('bob@example.com')
    cy.get('[data-cy=agree-checkbox]').check()
    cy.get('[data-cy=submit-btn]').click()

    cy.get('[data-cy=success-banner]').should('contain.text', 'Bob')
  })
})

describe('06 — dropdown selection', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('6 · Forms').click()
  })

  it('selects role from dropdown', () => {
    cy.get('[data-cy=role-select]').select('editor')
    cy.get('[data-cy=role-select]').should('have.value', 'editor')
  })

  it('defaults to viewer role', () => {
    cy.get('[data-cy=role-select]').should('have.value', 'viewer')
  })
})

describe('06 — checkbox interaction', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('6 · Forms').click()
  })

  it('agree checkbox starts unchecked', () => {
    cy.get('[data-cy=agree-checkbox]').should('not.be.checked')
  })

  it('checking agree removes agree-error after submit', () => {
    cy.get('[data-cy=submit-btn]').click()
    cy.get('[data-cy=agree-error]').should('exist')

    cy.get('[data-cy=agree-checkbox]').check()
    cy.get('[data-cy=name-input]').type('Test')
    cy.get('[data-cy=email-input]').type('test@test.com')
    cy.get('[data-cy=submit-btn]').click()

    cy.get('[data-cy=success-banner]').should('exist')
  })
})
