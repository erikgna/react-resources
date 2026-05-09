// 03 · Assertions — .should(), .and(), expect(), attribute/class assertions

describe('03 — existence and visibility', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('3 · Assertions').click()
  })

  it('success element exists after clicking set-success', () => {
    cy.get('[data-cy=set-success]').click()
    cy.get('[data-cy=status-success]').should('exist').and('be.visible')
  })

  it('error element does not exist when idle', () => {
    cy.get('[data-cy=set-idle]').click()
    cy.get('[data-cy=status-error]').should('not.exist')
  })

  it('loading element appears when set-loading clicked', () => {
    cy.get('[data-cy=set-loading]').click()
    cy.get('[data-cy=status-loading]').should('be.visible')
  })

  it('idle div is hidden (display:none), not absent', () => {
    cy.get('[data-cy=set-success]').click()
    cy.get('[data-cy=status-idle]').should('exist').and('not.be.visible')
  })
})

describe('03 — text content assertions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('3 · Assertions').click()
  })

  it('exact text match', () => {
    cy.get('[data-cy=set-success]').click()
    cy.get('[data-cy=status-success]').should('have.text', 'Success!')
  })

  it('partial text match with contain.text', () => {
    cy.get('[data-cy=set-error]').click()
    cy.get('[data-cy=status-error]').should('contain.text', 'Error')
  })

  it('role=alert on error element', () => {
    cy.get('[data-cy=set-error]').click()
    cy.get('[role=alert]').should('exist')
  })
})

describe('03 — attribute assertions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('3 · Assertions').click()
  })

  it('button toggles disabled attribute', () => {
    cy.get('[data-cy=toggle-btn]').should('not.be.disabled')
    cy.get('[data-cy=toggle-btn]').click()
    cy.get('[data-cy=toggle-btn]').should('be.disabled')
  })

  it('link has href attribute', () => {
    cy.get('[data-cy=ext-link]').should('have.attr', 'href', 'https://example.com')
  })

  it('aria-pressed reflects disabled state', () => {
    cy.get('[data-cy=toggle-btn]').click()
    cy.get('[data-cy=toggle-btn]').should('have.attr', 'aria-pressed', 'true')
  })
})

describe('03 — CSS class assertions', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('3 · Assertions').click()
  })

  it('button gains is-active class on click', () => {
    cy.get('[data-cy=toggle-class]').should('not.have.class', 'is-active')
    cy.get('[data-cy=toggle-class]').click()
    cy.get('[data-cy=toggle-class]').should('have.class', 'is-active')
  })

  it('button loses is-active class on second click', () => {
    cy.get('[data-cy=toggle-class]').click().click()
    cy.get('[data-cy=toggle-class]').should('not.have.class', 'is-active')
  })
})

describe('03 — chained assertions with .and()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('3 · Assertions').click()
  })

  it('chains multiple assertions on one element', () => {
    cy.get('[data-cy=set-error]').click()
    cy.get('[data-cy=status-error]')
      .should('be.visible')
      .and('have.text', 'Error occurred')
      .and('have.attr', 'role', 'alert')
  })
})
