import '@testing-library/jest-dom/extend-expect'

import { afterAll, afterEach, beforeAll, describe, it } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Fragment, useState } from 'react'

import type { ErrorFallbackProps } from '../src/ErrorBoundary'
import ErrorBoundary, { useError } from '../src/ErrorBoundary'

/**
 * Cannot (yet) use extended `expect` when importing from `@jest/globals`.
 *
 * @see https://github.com/facebook/jest/pull/11490
 */

const noop = () => null

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(noop)
})

afterEach(() => {
  jest.resetAllMocks()
})

afterAll(() => {
  jest.restoreAllMocks()
})

const errorMessage = 'Something went wrong!'

function ComponentThatThrows({ hasError = true }: { hasError?: boolean }) {
  if (hasError) {
    throw new Error(errorMessage)
  }

  return null
}

describe('Error boundary', () => {
  it('renders children when no error has occurred', () => {
    render(
      <ErrorBoundary>
        <h1>Test</h1>
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Test')
  })

  it('renders default error page when no fallback provided', () => {
    render(
      <ErrorBoundary>
        <ComponentThatThrows />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/An unexpected error has occurred/)).toBeDefined()
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('renders fallback element', () => {
    function Fallback() {
      const { error } = useError()
      return <p role="alert">{error.message}</p>
    }

    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ComponentThatThrows />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('renders fallback component', () => {
    function Fallback({ error }: { error: Error }) {
      return <p role="alert">{error.message}</p>
    }

    render(
      <ErrorBoundary fallback={Fallback}>
        <ComponentThatThrows />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('renders fallback function', () => {
    function Fallback({ message }: { message: string }) {
      return <p role="alert">{message}</p>
    }

    render(
      <ErrorBoundary fallback={({ error }) => <Fallback message={error.message} />}>
        <ComponentThatThrows />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('allows manually resetting error state', async () => {
    function Fallback({ error, onReset }: ErrorFallbackProps) {
      return (
        <p role="alert">
          {error.message} <button onClick={onReset}>Reset</button>
        </p>
      )
    }

    function App() {
      const [hasError, setError] = useState(false)

      return (
        <ErrorBoundary
          fallback={Fallback}
          onReset={() => {
            setError(false)
          }}
        >
          <h1>Test</h1>
          <ComponentThatThrows hasError={hasError} />
          <button
            onClick={() => {
              setError(true)
            }}
          >
            Crash!
          </button>
        </ErrorBoundary>
      )
    }

    render(<App />)

    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    fireEvent.click(screen.getByRole('button', { name: /crash/i }))
    await waitFor(() => screen.getByRole('alert'))
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    await waitFor(() => screen.getByRole('heading'))
    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('allows resetting error state with resetOnChange', async () => {
    function Fallback({ error }: ErrorFallbackProps) {
      return <p role="alert">{error.message}</p>
    }

    function App() {
      const [hasError, setError] = useState(false)
      const [resetToggle, setResetToggle] = useState(false)

      return (
        <Fragment>
          <ErrorBoundary fallback={Fallback} resetOnChange={[resetToggle, setResetToggle]}>
            <h1>Test</h1>
            <ComponentThatThrows hasError={hasError} />
            <button
              onClick={() => {
                setError(true)
              }}
            >
              Crash!
            </button>
          </ErrorBoundary>
          <button
            onClick={() => {
              setError(false)
            }}
          >
            Fix error
          </button>
          <button
            onClick={() => {
              setResetToggle((resetToggle) => !resetToggle)
            }}
          >
            Reset
          </button>
        </Fragment>
      )
    }

    render(<App />)

    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    fireEvent.click(screen.getByRole('button', { name: /crash/i }))
    await waitFor(() => screen.getByRole('alert'))
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /fix/i }))
    await waitFor(() => screen.getByRole('alert'))
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    await waitFor(() => screen.getByRole('heading'))
    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('does not throw twice when cause of error is in resetOnChange array', async () => {
    function Fallback({ error }: ErrorFallbackProps) {
      return <p role="alert">{error.message}</p>
    }

    function App() {
      const [hasError, setError] = useState(false)

      return (
        <Fragment>
          <ErrorBoundary fallback={Fallback} resetOnChange={[hasError]}>
            <h1>Test</h1>
            <ComponentThatThrows hasError={hasError} />
            <button
              onClick={() => {
                setError(true)
              }}
            >
              Crash!
            </button>
          </ErrorBoundary>
          <button
            onClick={() => {
              setError((hasError) => !hasError)
            }}
          >
            Toggle
          </button>
        </Fragment>
      )
    }

    render(<App />)

    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    fireEvent.click(screen.getByRole('button', { name: /crash/i }))
    await waitFor(() => screen.getByRole('alert'))
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /toggle/i }))
    await waitFor(() => screen.getByRole('heading'))
    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    /**
     * explanation for why we are checking prevState.error in componentDiDUpdate.
     * otherwise, we would throw the error *twice*:
     * - clicking crash button sets hasError, and therefore also changes resetOnChange
     * - error boundary sets state.error to true (getDerivedStateFromError), but also then in the same render-cycle tries to reset state.error in componentDidUpdate,
     *   because the resetOnChange keys have changed. this triggers a rerender, which causes another throw, but this time componentDidUpdate will not try to reset
     */
    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it('handles immediately thrown error', async () => {
    function Fallback({ error, onReset }: ErrorFallbackProps) {
      return (
        <p role="alert">
          {error.message} <button onClick={onReset}>Reset</button>
        </p>
      )
    }

    function App() {
      const [hasError, setError] = useState(true)

      return (
        <ErrorBoundary
          fallback={Fallback}
          onReset={() => {
            setError(false)
          }}
        >
          <h1>Test</h1>
          <ComponentThatThrows hasError={hasError} />
        </ErrorBoundary>
      )
    }

    render(<App />)

    await waitFor(() => screen.getByRole('alert'))
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    await waitFor(() => screen.getByRole('heading'))
    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    expect(console.error).toHaveBeenCalledTimes(2)
  })

  it.todo('defaults to resetting error state with resetOnRouteChange')

  it.todo('does not reset error state when resetOnRouteChange is false')
})
