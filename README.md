# next-error-boundary

Minimal React `ErrorBoundary` component. The fallback component can access the thrown error with the
`useError` hook, and reset the error state by calling `onReset`.

## Example

```tsx
import { useRouter } from 'next/router'
import ErrorBoundary, { useError } from '@stefanprobst/next-error-boundary'

function CustomErrorPage() {
  const { error, onReset } = useError()
  return (
    <section role="alert">
      <p>An unexpected error has occurred: {error.message}.</p>
      <button onClick={onReset}>Reset</button>
    </section>
  )
}

export default function Page() {
  const { router } = useRouter()
  return (
    <ErrorBoundary
      fallback={<CustomErrorPage />}
      onError={(error, errorInfo) => console.error(error, errorInfo)}
      onReset={() => resetStuffThatThrewError()}
      /**
       * Reset the error component when the route changes.
       */
      key={router.asPath}
    >
      <main>
        <h1>Hello World</h1>
      </main>
    </ErrorBoundary>
  )
}
```
