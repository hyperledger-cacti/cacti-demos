/**
 * Jest stub for the deprecated `request-promise-native` package.
 *
 * `request-promise-native` uses `stealthy-require` to load `request` freshly
 * by manipulating `require.cache`, which does not work under Jest's module
 * registry: the second copy of the module in the dependency graph (pulled in
 * through `web3js-quorum` from more than one npm dependency) configures the
 * same shared `request` instance twice and crashes with
 * "Unable to expose method then".
 *
 * None of the runnable test suites actually send requests through it (it is
 * only used for Besu privacy manager / Tessera calls which the tests do not
 * exercise), so the stub keeps module loading working and fails loudly if it
 * is ever called for real.
 */
function requestPromiseNativeStub() {
  throw new Error(
    "request-promise-native is stubbed out in Jest tests because " +
      "stealthy-require is incompatible with Jest's module registry. " +
      "If you need it, invoke the test outside Jest.",
  );
}

module.exports = Object.assign(requestPromiseNativeStub, {
  get: requestPromiseNativeStub,
  post: requestPromiseNativeStub,
  put: requestPromiseNativeStub,
  head: requestPromiseNativeStub,
  patch: requestPromiseNativeStub,
  del: requestPromiseNativeStub,
  delete: requestPromiseNativeStub,
  jar: requestPromiseNativeStub,
  cookie: requestPromiseNativeStub,
  defaults: requestPromiseNativeStub,
  forever: requestPromiseNativeStub,
  debug: requestPromiseNativeStub,
});
