// 02 · Interactions — cy.click(), cy.type(), cy.select(), cy.check(), .trigger()

describe('02 — cy.click()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('2 · Interactions').click()
  })

  it('increments counter on click', () => {
    cy.get('[data-cy=count]').should('have.text', '0')
    cy.get('[data-cy=inc-btn]').click()
    cy.get('[data-cy=count]').should('have.text', '1')
  })

  it('decrements counter on click', () => {
    cy.get('[data-cy=inc-btn]').click().click().click()
    cy.get('[data-cy=count]').should('have.text', '3')
    cy.get('[data-cy=dec-btn]').click()
    cy.get('[data-cy=count]').should('have.text', '2')
  })

  it('resets counter to zero', () => {
    cy.get('[data-cy=inc-btn]').click().click()
    cy.get('[data-cy=count]').should('have.text', '2')
    cy.get('[data-cy=reset-btn]').click()
    cy.get('[data-cy=count]').should('have.text', '0')
  })
})

describe('02 — cy.type()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('2 · Interactions').click()
  })

  it('types text and updates char count', () => {
    cy.get('[data-cy=text-input]').type('hello')
    cy.get('[data-cy=char-count]').should('have.text', '5 chars')
  })

  it('clears input with button', () => {
    cy.get('[data-cy=text-input]').type('hello')
    cy.get('[data-cy=clear-btn]').click()
    cy.get('[data-cy=char-count]').should('have.text', '0 chars')
  })

  it('clears and re-types with .clear()', () => {
    cy.get('[data-cy=text-input]').type('first')
    cy.get('[data-cy=text-input]').clear().type('second')
    cy.get('[data-cy=char-count]').should('have.text', '6 chars')
  })
})

describe('02 — cy.select()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('2 · Interactions').click()
  })

  it('selects by value', () => {
    cy.get('[data-cy=framework-select]').select('react')
    cy.get('[data-cy=selected-value]').should('have.text', 'selected: react')
  })

  it('selects by display text', () => {
    cy.get('[data-cy=framework-select]').select('Angular')
    cy.get('[data-cy=framework-select]').should('have.value', 'angular')
  })
})

describe('02 — cy.check() / cy.uncheck()', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('2 · Interactions').click()
  })

  it('checks a checkbox and updates count', () => {
    cy.get('[data-cy=enabled-count]').should('have.text', '1 enabled')
    cy.get('[data-cy=checkbox-lint]').check()
    cy.get('[data-cy=enabled-count]').should('have.text', '2 enabled')
  })

  it('unchecks a checkbox', () => {
    cy.get('[data-cy=checkbox-ts]').uncheck()
    cy.get('[data-cy=enabled-count]').should('have.text', '0 enabled')
  })
})

describe('02 — .trigger() hover events', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173')
    cy.contains('2 · Interactions').click()
  })

  it('shows dropdown on mouseenter', () => {
    cy.get('[data-cy=menu-dropdown]').should('not.exist')
    cy.get('[data-cy=menu-trigger]').trigger('mouseenter')
    cy.get('[data-cy=menu-dropdown]').should('be.visible')
  })

  it('hides dropdown on mouseleave', () => {
    cy.get('[data-cy=menu-trigger]').trigger('mouseenter')
    cy.get('[data-cy=menu-dropdown]').should('be.visible')
    cy.get('[data-cy=menu-trigger]').trigger('mouseleave')
    cy.get('[data-cy=menu-dropdown]').should('not.exist')
  })
})
