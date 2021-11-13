import '@testing-library/jest-dom/extend-expect'

import { afterAll, afterEach, beforeAll, describe, it } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

import type { ErrorFallbackProps } from '../src/ErrorBoundary'
import { ErrorBoundary, useError } from '../src/ErrorBoundary'

/* eslint-disable arrow-body-style */

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
      <ErrorBoundary fallback={() => null}>
        <h1>Test</h1>
      </ErrorBoundary>,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Test')
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
    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    await screen.findByRole('heading')
    expect(screen.getByRole('heading')).toHaveTextContent('Test')

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

    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage)

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    await screen.findByRole('heading')
    expect(screen.getByRole('heading')).toHaveTextContent('Test')

    expect(console.error).toHaveBeenCalledTimes(2)
  })
})
