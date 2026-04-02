// Type declarations for modules exposed by remote_app.
// These are manual stubs — @module-federation/vite generates real types
// under dist/@mf-types but wiring that up requires tsconfig path mapping.
// Stubs are sufficient for a POC.

declare module 'remote_app/Button' {
    const Button: () => JSX.Element
    export default Button
  }
  
  declare module 'remote_app/Counter' {
    const Counter: () => JSX.Element
    export default Counter
  }
  
  declare module 'remote_app/utils' {
    export function formatCount(n: number): string
  }