import { assert } from '@stefanprobst/assert'
import NextErrorPage from 'next/error'
import Router from 'next/router'
import type { ErrorInfo, FC, ReactNode } from 'react'
import { Component, createContext, Fragment, useContext } from 'react'

export interface ErrorBoundaryState {
  error: Error | null
}

export interface ErrorFallbackProps {
  error: Error
  onReset: () => void
}

export const ErrorBoundaryContext = createContext<ErrorFallbackProps | null>(null)

export function useError(): ErrorFallbackProps {
  const errorBoundaryContext = useContext(ErrorBoundaryContext)

  assert(
    errorBoundaryContext !== null,
    '`useError` must be nested inside an `ErrorBoundaryProvider`.',
  )

  return errorBoundaryContext
}

export interface ErrorBoundaryProps {
  children?: ReactNode
  fallback?: FC<ErrorFallbackProps> | JSX.Element
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: () => void
  resetOnChange?: Array<unknown>
  /** @default true */
  resetOnRouteChange?: boolean
}

const initialState = { error: null }

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
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

  componentDidMount(): void {
    if (this.props.resetOnRouteChange !== false) {
      Router.events.on('routeChangeComplete', this.onReset)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState): void {
    function hasChanged(a: Array<unknown> = [], b: Array<unknown> = []) {
      return a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))
    }

    if (
      this.state.error !== null &&
      /**
       * see test comment for why we don't immediately reset the error state
       * when both error state and resetOnChange array change in the same render cycle
       */
      prevState.error !== null &&
      hasChanged(prevProps.resetOnChange, this.props.resetOnChange)
    ) {
      this.onReset()
    }
  }

  componentWillUnmount(): void {
    Router.events.off('routeChangeStart', this.onReset)
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
        const contextValue = { error, onReset: this.onReset }

        return (
          <ErrorBoundaryContext.Provider value={contextValue}>
            {typeof Fallback === 'function' ? <Fallback {...contextValue} /> : Fallback}
          </ErrorBoundaryContext.Provider>
        )
      }

      return <NextErrorPage statusCode={400} title="An unexpected error has occurred" />
    }

    return <Fragment>{this.props.children}</Fragment>
  }
}
