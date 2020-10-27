import NextErrorPage from 'next/error'
import * as React from 'react'
import { Component, createContext, Fragment, useContext } from 'react'
import type { ErrorInfo, FC } from 'react'

type ErrorBoundaryProps = {
  fallback?: FC | JSX.Element
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
}

type ErrorBoundaryState = {
  error: Error | null
  onReset: () => void
  setError: (error: Error | null) => void
}

type ErrorBoundaryContext = {
  error: Error
  onReset: () => void
  setError: (error: Error | null) => void
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContext | null>(null)

export function useError(): ErrorBoundaryContext {
  const errorBoundaryContext = useContext(ErrorBoundaryContext)

  if (errorBoundaryContext === null) {
    throw new Error(
      'useError must be nested inside an ErrorBoundaryContext.Provider',
    )
  }

  return errorBoundaryContext
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.onReset = this.onReset.bind(this)
    this.setError = this.setError.bind(this)

    this.state = { error: null, onReset: this.onReset, setError: this.setError }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props

    if (typeof onError === 'function') {
      onError(error, errorInfo)
    }
  }

  setError(error: Error | null): void {
    this.setState({ error })
  }

  onReset(): void {
    if (typeof this.props.onReset === 'function') {
      this.props.onReset()
    }
    this.setError(null)
  }

  render(): JSX.Element {
    if (this.state.error !== null) {
      const { fallback: Fallback } = this.props

      if (Fallback !== undefined) {
        return (
          <ErrorBoundaryContext.Provider
            value={this.state as ErrorBoundaryState & { error: Error }}
          >
            {typeof Fallback === 'function' ? <Fallback /> : Fallback}
          </ErrorBoundaryContext.Provider>
        )
      }

      return (
        <NextErrorPage
          statusCode={500}
          title="An unexpected error has occurred"
        />
      )
    }

    return <Fragment>{this.props.children}</Fragment>
  }
}
