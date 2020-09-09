/**
 * workaround for microbundle's handling of mixed default and named exports
 * @see https://github.com/developit/microbundle/issues/712#issuecomment-683794530
 */

import ErrorBoundary, { useError } from './ErrorBoundary'
Object.assign(ErrorBoundary, { useError })
export default ErrorBoundary
