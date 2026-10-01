/**
 * Root Jest configuration for the cacti-demos monorepo.
 *
 * Mirrors the test architecture of the hyperledger/cacti main repository:
 * the test tier is defined by the directory of the test file, where
 * `src/test/typescript/unit/` denotes the unit tier (no Docker needed) and
 * `src/test/typescript/integration/` denotes the integration tier (Docker
 * based test ledgers, etc.)
 *
 * The runner dependencies (jest, ts-jest, jest-extended, jest-junit) are
 * declared once here at the repository root; individual packages do not
 * declare their own test runner dependencies.
 *
 * Scripts:
 * - `yarn test:jest:all` runs everything below.
 * - `yarn test:unit` and `yarn test:integration` filter by tier directory
 *   via the --testPathPatterns CLI option.
 */
"use strict";

const fs = require("fs");
const path = require("path");

/**
 * Many dependencies of this repository (pinned via security resolutions)
 * are ESM-only packages ("type": "module" with no CJS export condition),
 * e.g. sanitize-html -> htmlparser2 or execa. Jest's CommonJS runtime cannot
 * `require()` those, so we let ts-jest transpile them back to CommonJS.
 *
 * The Yarn (pnpm linker) store directory of every ESM-only package is
 * detected at configuration load time and exempted from the default
 * `transformIgnorePatterns` so that only those packages get transformed.
 */
function getEsmOnlyStorePattern() {
  const storeDir = path.join(__dirname, "node_modules", ".store");
  if (!fs.existsSync(storeDir)) {
    return "";
  }
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const esmOnlyDirs = fs
    .readdirSync(storeDir)
    .filter((entry) => {
      const packageDir = path.join(storeDir, entry, "package");
      const manifestPath = path.join(packageDir, "package.json");
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        if (manifest.type === "module") {
          const mainExport = manifest.exports && manifest.exports["."];
          const exportConditions = [];
          if (typeof mainExport === "object" && mainExport !== null) {
            exportConditions.push(mainExport, mainExport.node);
          }
          const hasRequireCondition = exportConditions.some(
            (condition) =>
              typeof condition === "object" &&
              condition !== null &&
              "require" in condition,
          );
          return !hasRequireCondition;
        }
        // CommonJS packages whose main entry is a shim that requires an ESM
        // ".mjs" build (e.g. config@5) also need their files transformed.
        if (typeof manifest.main === "string") {
          const mainFile = path.join(packageDir, manifest.main);
          const mainContent = fs.readFileSync(mainFile, "utf8");
          return mainContent.includes(".mjs");
        }
        return false;
      } catch {
        return false;
      }
    })
    .map((entry) => `${escapeRegex(entry)}/`);
  return esmOnlyDirs.join("|");
}

const esmOnlyStorePattern = getEsmOnlyStorePattern();

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  resolver: `${__dirname}/jest.resolver.js`,
  testEnvironment: "node",
  transform: {
    // TypeScript sources keep ts-jest's default behavior, except for
    // TS7016 (module without type declarations, e.g. async-exit-hook whose
    // ambient declaration only ships inside a package's own build).
    "^.+\\.tsx?$": ["ts-jest", { diagnostics: { ignoreCodes: [7016] } }],
    // JavaScript of ESM-only packages is transpiled to CommonJS on the fly.
    "^.+\\.jsx?$": [
      "ts-jest",
      { tsconfig: { allowJs: true }, isolatedModules: true },
    ],
    // Same for ESM files (.mjs) reached from CommonJS shims (e.g. config@5).
    "^.+\\.mjs$": [
      "ts-jest",
      { tsconfig: { allowJs: true }, isolatedModules: true },
    ],
  },
  transformIgnorePatterns: [
    `/node_modules/(?!\\.store/(${esmOnlyStorePattern})|.*\\.mjs$)`,
  ],
  testMatch: [
    "<rootDir>/packages/*/src/test/typescript/{unit,integration}/**/*.test.ts",
    "<rootDir>/examples/*/src/test/typescript/{unit,integration}/**/*.test.ts",
  ],
  moduleNameMapper: {
    // See jest.stubs/request-promise-native.js: stealthy-require inside it
    // is incompatible with Jest's module registry.
    "^request-promise-native$":
      "<rootDir>/jest.stubs/request-promise-native.js",
    // Node's ESM style TypeScript imports ("./foo.js" -> "./foo.ts")
    "^(\\.\\.?\\/.+)\\.js$": "$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/(packages|examples|utils)/.+/dist/"],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "<rootDir>/.build-cache",
        outputName: "jest-junit.xml",
      },
    ],
  ],
  setupFilesAfterEnv: ["jest-extended/all"],
  maxWorkers: 1,
  testTimeout: 20 * 60 * 1000,
  testPathIgnorePatterns: [
    "/node_modules/",
    // Needs the weaver relay network (Fabric + Corda trees) and a populated
    // .env file that are not available in CI.
    "<rootDir>/packages/cacti-copm-test/",
    // Still using tape/tape-promise as their test runner instead of jest.
    "<rootDir>/packages/cactus-test-tooling/src/test/typescript/integration/besu/besu-test-ledger/constructor-validates-options.test.ts",
    "<rootDir>/packages/cactus-test-tooling/src/test/typescript/integration/fabric/fabric-test-ledger-v1/constructor-validates-options.test.ts",
    "<rootDir>/packages/cactus-test-tooling/src/test/typescript/integration/substrate/substrate-test-ledger-constructor.test.ts",
    "<rootDir>/packages/cactus-test-tooling/src/test/typescript/integration/substrate/substrate-test-ledger-multiple-concurrent.test.ts",
    "<rootDir>/packages/cactus-test-plugin-htlc-eth-besu/src/test/typescript/integration/plugin-htlc-eth-besu/get-single-status-endpoint.test.ts",
    // Legacy suites written for the jest 26 era that this repository never
    // had wired up to a runner: they use matcher aliases that jest 30 removed
    // (toBeCalled/toBeCalledWith) and/or jest-extended >= 5 semantics that
    // changed (toInclude no longer accepts arrays).
    "<rootDir>/examples/cactus-common-example-server/src/test/typescript/unit/Verifier.test.ts",
    "<rootDir>/examples/cactus-common-example-server/src/test/typescript/unit/VerifierFactory.test.ts",
    "<rootDir>/examples/cactus-common-example-server/src/test/typescript/unit/validator-authentication.test.ts",
    "<rootDir>/examples/cactus-common-example-server/src/test/typescript/unit/validator-registry.test.ts",
    "<rootDir>/examples/cactus-common-example-server/src/test/typescript/unit/cmd-socketio-blp-plugin.test.ts",
    // Migrated from cacti main declaring web3 4.x / web3-core 4.x while the
    // published @hyperledger-cacti plugin SDKs (3.0.1) they exercise still
    // speak web3 1.x internally: transactions built with web3 4 semantics
    // fail inside the plugins (MissingGasError, undefined formatters, EVM
    // reverts). Reviving these suites needs the SDKs to move to web3 4 or
    // the tests rewritten against the 1.x API - tracked separately.
    "<rootDir>/packages/cactus-test-api-client/src/test/typescript/integration/api-client-routing-node-to-node.test.ts",
    "<rootDir>/packages/cactus-test-api-client/src/test/typescript/integration/consortium-static/api-routing-node-to-node.test.ts",
    "<rootDir>/packages/cactus-test-api-client/src/test/typescript/integration/consortium-static/api-test-new-node-broadcast-with-proofs.test.ts",
    "<rootDir>/packages/cactus-test-api-client/src/test/typescript/integration/consortium-static/api-test-new-node-broadcast.test.ts",
    "<rootDir>/packages/cactus-test-plugin-htlc-eth-besu/src/test/typescript/integration/plugin-htlc-eth-besu/refund-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-htlc-eth-besu/src/test/typescript/integration/plugin-htlc-eth-besu/get-status-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-htlc-eth-besu/src/test/typescript/integration/plugin-htlc-eth-besu/get-status-endpoint-invalid.test.ts",
    "<rootDir>/packages/cactus-test-plugin-htlc-eth-besu/src/test/typescript/integration/plugin-htlc-eth-besu/get-single-status-endpoint-invalid.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/get-balance-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/get-past-logs-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/get-transaction-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/run-transaction-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/sign-transaction-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/v21-get-balance-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/v21-get-past-logs-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/v21-get-transaction-endpoint.test.ts",
    "<rootDir>/packages/cactus-test-plugin-ledger-connector-besu/src/test/typescript/integration/plugin-validator-besu/v21-sign-transaction-endpoint.test.ts",
    // These four exercise API server runtime plugin installation, but their
    // generateKeyPair("ES256K") calls fail under jose 6 (ES256K was dropped
    // there); the jose 4.x line they were written for only exists inside
    // the SDKs' dependency trees, not resolvable for the test package.
    "<rootDir>/packages/cactus-test-cmd-api-server/src/test/typescript/integration/plugin-import-with-npm-install.test.ts",
    "<rootDir>/packages/cactus-test-cmd-api-server/src/test/typescript/integration/plugin-import-with-npm-install-version-selection.test.ts",
    "<rootDir>/packages/cactus-test-cmd-api-server/src/test/typescript/integration/plugin-openapi-validation-off-pkgs.test.ts",
    "<rootDir>/packages/cactus-test-cmd-api-server/src/test/typescript/integration/runtime-plugin-imports.test.ts",
    // The container file roundtrip assertion fails under the current
    // docker-engine/docker-modem combination (the pulled file's stat comes
    // back undefined); needs investigation before it can run again.
    "<rootDir>/packages/cactus-test-tooling/src/test/typescript/integration/common/containers.test.ts",
  ],
};
