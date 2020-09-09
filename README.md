# next-error-boundary

ErrorBoundary component for Next.js apps. Renders the error page from
`next/error` by default. The fallback component can access the thrown error with
the `useError` hook.

## Example

```tsx
import ErrorBoundary, { useError } from '@stefanprobst/next-error-boundary'

function CustomErrorPage() {
  const error = useError()
  return <p>An unexpected error has occurred: {error.message}.</p>
}

function Page() {
  return (
    <ErrorBoundary fallback={<CustomErrorPage />}>
      <main>
        <h1>Hello World</h1>
      </main>
    </ErrorBoundary>
  )
}
```
