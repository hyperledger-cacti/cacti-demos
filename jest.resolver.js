/**
 * Custom Jest resolver for the cacti-demos monorepo.
 *
 * Some dependencies of this repository (pinned via security resolutions) are
 * ESM-only packages whose package.json "exports" map only defines "import"
 * conditions (e.g. unicorn-magic@0.3.0). Jest's CommonJS runtime cannot
 * resolve such packages on its own because it looks for "require" conditions.
 *
 * This resolver first attempts the default (CommonJS) resolution and, only
 * when that fails, retries with the "import" condition added so that the
 * ESM entry point can be loaded and transpiled to CommonJS by ts-jest
 * (see the transform/transformIgnorePatterns setup in jest.config.js).
 *
 * @param {string} path The module request to resolve.
 * @param {import('jest-resolve').ResolverOptions} options Resolution options.
 * @returns {string} The resolved module path.
 */
module.exports = (path, options) => {
  try {
    return options.defaultResolver(path, options);
  } catch (defaultError) {
    try {
      return options.defaultResolver(path, {
        ...options,
        conditions: [...(options.conditions || []), "import"],
      });
    } catch {
      throw defaultError;
    }
  }
};
