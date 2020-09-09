import NextErrorPage from 'next/error'
import * as React from 'react'
import { Component, createContext, Fragment, useContext } from 'react'
import type { ErrorInfo, FC } from 'react'

type ErrorBoundaryProps = {
  fallback?: FC | JSX.Element
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

type ErrorBoundaryState = {
  error: Error | null
}

const ErrorBoundaryContext = createContext<Error | null>(null)

export function useError(): Error {
  const error = useContext(ErrorBoundaryContext)

  if (error === null) {
    throw new Error(
      'useError must be nested inside an ErrorBoundaryContext.Provider',
    )
  }

  return error
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError } = this.props

    if (typeof onError === 'function') {
      onError(error, errorInfo)
    }
  }

  render(): JSX.Element {
    const { error } = this.state

    if (error !== null) {
      const { fallback: Fallback } = this.props

      if (Fallback !== undefined) {
        return (
          <ErrorBoundaryContext.Provider value={error}>
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
