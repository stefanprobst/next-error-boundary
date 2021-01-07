import NextErrorPage from 'next/error'
import * as React from 'react'
import { Component, Fragment, createContext, useContext } from 'react'
import type { ErrorInfo, FC } from 'react'

export interface ErrorBoundaryState {
  error: Error | null
}

export interface ErrorBoundaryContext {
  error: Error
  onReset: () => void
}

export const ErrorBoundaryContext = createContext<ErrorBoundaryContext | null>(
  null,
)

export function useError(): ErrorBoundaryState {
  const errorBoundaryContext = useContext(ErrorBoundaryContext)

  if (errorBoundaryContext === null) {
    throw new Error(
      '`useError` must be nested inside an `ErrorBoundaryProvider`.',
    )
  }

  return errorBoundaryContext
}

export interface ErrorBoundaryProps {
  children: JSX.Element
  fallback?: FC | JSX.Element
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: () => void
  resetOnChange?: Array<unknown>
}

const initialState = { error: null }

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.onReset = this.onReset.bind(this)

    this.state = initialState
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    function hasChanged(a: Array<unknown> = [], b: Array<unknown> = []) {
      return (
        a.length !== b.length ||
        a.some((item, index) => !Object.is(item, b[index]))
      )
    }

    if (
      this.state.error !== null &&
      hasChanged(prevProps.resetOnChange, this.props.resetOnChange)
    ) {
      this.onReset()
    }
  }

  onReset(): void {
    this.props.onReset?.()
    this.setState(initialState)
  }

  render(): JSX.Element {
    const { error } = this.state

    if (error !== null) {
      const { fallback: Fallback } = this.props

      if (Fallback !== undefined) {
        return (
          <ErrorBoundaryContext.Provider
            value={{ error, onReset: this.onReset }}
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
