# React Router Comparison

| Feature               | Declarative Routes                       | Data Routes                  | Template / Framework Routes      |
| --------------------- | ---------------------------------------- | ---------------------------- | -------------------------------- |
| **Definition style**  | JSX components (`<Routes>`, `<Route>`)   | Route objects                | File-based or framework template |
| **Typical usage**     | Simple SPAs                              | Apps needing loaders/actions | Full-stack React Router apps     |
| **Data loading**      | Manual (`useEffect`, fetch, React Query) | Built-in `loader()`          | Built-in `loader()`              |
| **Mutations / forms** | Manual fetch / axios                     | `action()` handlers          | `action()` handlers              |
| **Error handling**    | Custom error boundaries                  | `errorElement` per route     | Built-in                         |
| **Code splitting**    | Manual `React.lazy()`                    | Supported                    | Usually automatic                |
| **Nested routes**     | Supported                                | Supported                    | Supported                        |
| **Best for**          | Simple apps                              | Data-driven apps             | Structured production apps       |

## Data Router
```tsx
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/users",
    element: <Users />,
    loader: async () => {
      const res = await fetch("/api/users");
      return res.json();
    },
  },
]);
```

Inside component:

```tsx
import { useLoaderData } from "react-router-dom";

function Users() {
  const users = useLoaderData();
}
```

## Template / Framework Mode
```
app/
  routes/
    home.tsx
    users.tsx
    users.$id.tsx
```

Route file:
```tsx
export async function loader() {
  return fetch("/api/users");
}

export default function Users() {
  const users = useLoaderData();
}
```