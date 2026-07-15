declare module 'async-exit-hook' {
  export interface IAsyncExitHookDoneCallback {
    (): void;
  }
  const exitHook: (callback: (done: IAsyncExitHookDoneCallback) => void | Promise<void>) => void;
  export default exitHook;
}
