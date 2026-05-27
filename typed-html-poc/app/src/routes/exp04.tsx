// exp04 — List Rendering
// Internal: contentsToString flattens arrays with Array.isArray check
// map() returns string[] which is passed as single content item
// Array items joined with '\n'
import * as elements from 'typed-html'

const FRUITS = ['Apple', 'Banana', 'Cherry', 'Durian', 'Elderberry']
const USERS = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Carol', role: 'user' },
]

// impl_1 — basic map over array
function impl1(): string {
  return (
    <ul>
      {FRUITS.map(f => <li>{f}</li>)}
    </ul>
  )
}

// impl_2 — map with index
function impl2(): string {
  return (
    <ol>
      {FRUITS.map((f, i) => <li>{i + 1}. {f}</li>)}
    </ol>
  )
}

// impl_3 — map over objects
function impl3(): string {
  return (
    <table>
      <thead>
        <tr><th>ID</th><th>Name</th><th>Role</th></tr>
      </thead>
      <tbody>
        {USERS.map(u => (
          <tr>
            <td>{u.id}</td>
            <td>{u.name}</td>
            <td>{u.role}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// impl_4 — filter + map
function impl4(): string {
  return (
    <ul>
      {USERS
        .filter(u => u.role === 'user')
        .map(u => <li>{u.name}</li>)
      }
    </ul>
  )
}

// impl_5 — empty array behavior
function impl5(): string {
  const empty: string[] = []
  return (
    <div>
      <p>Empty list:</p>
      <ul>
        {empty.map(x => <li>{x}</li>)}
      </ul>
      <p>Renders empty ul — no items</p>
    </div>
  )
}

// impl_6 — nested lists
function impl6(): string {
  const categories = [
    { name: 'Fruit', items: ['Apple', 'Banana'] },
    { name: 'Veg', items: ['Carrot', 'Daikon'] },
  ]
  return (
    <ul>
      {categories.map(cat => (
        <li>
          {cat.name}
          <ul>
            {cat.items.map(item => <li>{item}</li>)}
          </ul>
        </li>
      ))}
    </ul>
  )
}

// impl_7 — join vs map: understand the difference
// map returns string[], contentsToString joins with \n
// join('') returns a single string — different whitespace behavior
function impl7(): string {
  const items = FRUITS.map(f => `<li>${f}</li>`)
  return (
    <ul>
      {items.join('')}
    </ul>
  )
}

// impl_8 — conditional items in list
function impl8(): string {
  return (
    <ul>
      {USERS.map(u => u.role === 'admin'
        ? <li><strong>{u.name}</strong> (admin)</li>
        : <li>{u.name}</li>
      )}
    </ul>
  )
}

// impl_9 — flatMap for nested data
function impl9(): string {
  const pages = [
    { section: 'A', items: ['A1', 'A2'] },
    { section: 'B', items: ['B1'] },
  ]
  return (
    <ul>
      {pages.flatMap(p => p.items.map(item => <li>{p.section}: {item}</li>))}
    </ul>
  )
}

// impl_10 — clean pattern: extract render function, no inline logic
function renderUser(u: typeof USERS[number]): string {
  return (
    <tr class={u.role === 'admin' ? 'admin-row' : ''}>
      <td>{u.id}</td>
      <td>{u.name}</td>
      <td>{u.role}</td>
    </tr>
  )
}

function impl10(): string {
  return (
    <table>
      <thead><tr><th>ID</th><th>Name</th><th>Role</th></tr></thead>
      <tbody>{USERS.map(renderUser)}</tbody>
    </table>
  )
}

export function exp04(): string {
  return (
    <html lang="en">
      <head><title>exp04 — List Rendering</title></head>
      <body>
        <h1>exp04 — List Rendering</h1>
        <p>Internal: contentsToString flattens arrays → joins with newline</p>

        <section><h2>impl_1: Basic map</h2>{impl1()}</section>
        <section><h2>impl_2: Map with index</h2>{impl2()}</section>
        <section><h2>impl_3: Object array → table</h2>{impl3()}</section>
        <section><h2>impl_4: Filter + map</h2>{impl4()}</section>
        <section><h2>impl_5: Empty array</h2>{impl5()}</section>
        <section><h2>impl_6: Nested lists</h2>{impl6()}</section>
        <section><h2>impl_7: join vs map</h2>{impl7()}</section>
        <section><h2>impl_8: Conditional items</h2>{impl8()}</section>
        <section><h2>impl_9: flatMap</h2>{impl9()}</section>
        <section><h2>impl_10: Extract render function</h2>{impl10()}</section>
      </body>
    </html>
  )
}
