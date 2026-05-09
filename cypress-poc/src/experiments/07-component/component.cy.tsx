// Component testing spec — runs via: npm run cy:component
// No cy.visit() needed. cy.mount() renders directly in real Chromium.

import { Button, Accordion, ThemeProvider, ThemeAwareBox } from './ComponentExperiment'

describe('Button — variants', () => {
  it('renders default variant', () => {
    cy.mount(<Button>Default</Button>)
    cy.get('[data-cy=btn]').should('have.text', 'Default')
    cy.get('[data-cy=btn]').should('have.attr', 'data-variant', 'default')
  })

  it('renders primary variant', () => {
    cy.mount(<Button variant="primary">Save</Button>)
    cy.get('[data-cy=btn]').should('have.attr', 'data-variant', 'primary')
  })

  it('renders danger variant', () => {
    cy.mount(<Button variant="danger">Delete</Button>)
    cy.get('[data-cy=btn]').should('have.attr', 'data-variant', 'danger')
  })

  it('is disabled when disabled prop is set', () => {
    cy.mount(<Button disabled>Submit</Button>)
    cy.get('[data-cy=btn]').should('be.disabled')
  })
})

describe('Button — interactions', () => {
  it('calls onClick when clicked', () => {
    const onClick = cy.stub().as('clickHandler')
    cy.mount(<Button onClick={onClick}>Click me</Button>)
    cy.get('[data-cy=btn]').click()
    cy.get('@clickHandler').should('have.been.calledOnce')
  })

  it('does not call onClick when disabled', () => {
    const onClick = cy.stub().as('clickHandler')
    cy.mount(<Button disabled onClick={onClick}>No click</Button>)
    cy.get('[data-cy=btn]').click({ force: true })
    cy.get('@clickHandler').should('not.have.been.called')
  })
})

describe('Accordion — open/close behavior', () => {
  it('starts closed', () => {
    cy.mount(<Accordion title="Details">Hidden</Accordion>)
    cy.get('[data-cy=accordion-trigger]').should('have.attr', 'aria-expanded', 'false')
    cy.get('[data-cy=accordion-content]').should('not.exist')
  })

  it('opens on click', () => {
    cy.mount(<Accordion title="Details">Hidden content</Accordion>)
    cy.get('[data-cy=accordion-trigger]').click()
    cy.get('[data-cy=accordion-trigger]').should('have.attr', 'aria-expanded', 'true')
    cy.get('[data-cy=accordion-content]').should('be.visible').and('contain.text', 'Hidden content')
  })

  it('closes on second click', () => {
    cy.mount(<Accordion title="Details">Content</Accordion>)
    cy.get('[data-cy=accordion-trigger]').click()
    cy.get('[data-cy=accordion-content]').should('exist')
    cy.get('[data-cy=accordion-trigger]').click()
    cy.get('[data-cy=accordion-content]').should('not.exist')
  })
})

describe('ThemeAwareBox — context provider', () => {
  it('renders dark theme', () => {
    cy.mount(
      <ThemeProvider dark={true}>
        <ThemeAwareBox />
      </ThemeProvider>
    )
    cy.get('[data-cy=theme-box]').should('have.attr', 'data-theme', 'dark')
    cy.get('[data-cy=theme-box]').should('contain.text', 'dark')
  })

  it('renders light theme', () => {
    cy.mount(
      <ThemeProvider dark={false}>
        <ThemeAwareBox />
      </ThemeProvider>
    )
    cy.get('[data-cy=theme-box]').should('have.attr', 'data-theme', 'light')
    cy.get('[data-cy=theme-box]').should('contain.text', 'light')
  })
})
