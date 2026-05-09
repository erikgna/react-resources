import { test as base, expect } from '@playwright/experimental-ct-react'
import type { Locator } from '@playwright/experimental-ct-react'
import { LoginForm, TodoList } from './PageObjectsExperiment'

// ─── Page Object classes ───────────────────────────────────────────────────────

class LoginFormPOM {
  constructor(private root: Locator) {}

  get email()    { return this.root.getByLabel('Email') }
  get password() { return this.root.getByLabel('Password') }
  get submit()   { return this.root.getByRole('button', { name: 'Log in' }) }
  get error()    { return this.root.getByRole('alert') }
  get welcome()  { return this.root.getByTestId('welcome') }

  async login(email: string, password: string) {
    await this.email.fill(email)
    await this.password.fill(password)
    await this.submit.click()
  }
}

class TodoListPOM {
  constructor(private root: Locator) {}

  get input()   { return this.root.getByLabel('New todo') }
  get addBtn()  { return this.root.getByRole('button', { name: 'Add' }) }
  get items()   { return this.root.getByRole('listitem') }
  get count()   { return this.root.getByTestId('todo-count') }

  async add(text: string) {
    await this.input.fill(text)
    await this.addBtn.click()
  }

  async complete(text: string) {
    await this.root.getByRole('checkbox', { name: `Complete: ${text}` }).check()
  }

  async delete(text: string) {
    await this.root.getByRole('button', { name: `Delete: ${text}` }).click()
  }
}

// ─── Fixture extension ────────────────────────────────────────────────────────

type MyFixtures = { loginForm: LoginFormPOM; todoList: TodoListPOM }

const test = base.extend<MyFixtures>({
  loginForm: async ({ mount }, use) => {
    const component = await mount(<LoginForm />)
    await use(new LoginFormPOM(component))
  },
  todoList: async ({ mount }, use) => {
    const component = await mount(<TodoList />)
    await use(new TodoListPOM(component))
  },
})

// ─── 6.1 LoginForm POM ────────────────────────────────────────────────────────

test.describe('LoginFormPOM', () => {
  test('successful login shows welcome message', async ({ loginForm }) => {
    await loginForm.login('user@example.com', 'securepassword')
    await expect(loginForm.welcome).toBeVisible()
    await expect(loginForm.welcome).toContainText('user@example.com')
  })

  test('empty fields show error', async ({ loginForm }) => {
    await loginForm.submit.click()
    await expect(loginForm.error).toBeVisible()
    await expect(loginForm.error).toHaveText('All fields required')
  })

  test('short password shows error', async ({ loginForm }) => {
    await loginForm.login('user@example.com', 'short')
    await expect(loginForm.error).toHaveText('Password must be 8+ characters')
  })

  test('login form fields are accessible', async ({ loginForm }) => {
    await expect(loginForm.email).toBeVisible()
    await expect(loginForm.password).toBeVisible()
    await expect(loginForm.submit).toBeEnabled()
  })
})

// ─── 6.2 TodoList POM ────────────────────────────────────────────────────────

test.describe('TodoListPOM', () => {
  test('starts with 2 default todos', async ({ todoList }) => {
    await expect(todoList.items).toHaveCount(2)
    await expect(todoList.count).toContainText('2 remaining')
  })

  test('add() appends a new todo', async ({ todoList }) => {
    await todoList.add('New task')
    await expect(todoList.items).toHaveCount(3)
    await expect(todoList.root.getByText('New task')).toBeVisible()
  })

  test('complete() marks todo as done', async ({ todoList }) => {
    await todoList.complete('Learn Playwright CT')
    const checkbox = todoList.root.getByRole('checkbox', { name: 'Complete: Learn Playwright CT' })
    await expect(checkbox).toBeChecked()
    await expect(todoList.count).toContainText('1 remaining')
  })

  test('delete() removes the todo', async ({ todoList }) => {
    await todoList.delete('Write deep POC')
    await expect(todoList.items).toHaveCount(1)
    await expect(todoList.root.getByText('Write deep POC')).not.toBeVisible()
  })

  test('Enter key adds todo', async ({ todoList }) => {
    await todoList.input.fill('Via enter key')
    await todoList.input.press('Enter')
    await expect(todoList.items).toHaveCount(3)
    await expect(todoList.root.getByText('Via enter key')).toBeVisible()
  })
})

// ─── 6.3 Inline POM (without fixtures) ───────────────────────────────────────

test.describe('Inline POM — base test without fixture', () => {
  test('wraps component in POM after mount', async ({ mount }) => {
    const component = await mount(<LoginForm />)
    const form = new LoginFormPOM(component)

    await form.login('admin@example.com', 'adminpassword')
    await expect(form.welcome).toContainText('admin@example.com')
  })
})
