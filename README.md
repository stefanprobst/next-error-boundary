# next-error-boundary

ErrorBoundary component for Next.js apps, based on
[`react-error-boundary`](https://github.com/bvaughn/react-error-boundary). Renders the error page
from `next/error` by default. The fallback component can access the thrown error with the `useError`
hook.

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
      resetOnChange={[router.asPath]}
      // resetOnRouteChange={false}
    >
      <main>
        <h1>Hello World</h1>
      </main>
    </ErrorBoundary>
  )
}
```
