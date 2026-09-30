const { override, addWebpackModuleRule } = require("customize-cra");

// react-scripts references its PostCSS plugins by name, which breaks under
// yarn's pnpm node linker (the plugins are not resolvable from postcss-loader's
// own install path). Resolve them here and pass the module objects instead.
const postcssFlexbugsFixes = require("postcss-flexbugs-fixes");
const postcssPresetEnv = require("postcss-preset-env");
const postcssNormalize = require("postcss-normalize");

function fixPostcssPlugins(config) {
  const rules = config.module && config.module.rules;
  if (!rules) return config;
  for (const rule of rules) {
    if (typeof rule === "object" && Array.isArray(rule.oneOf)) {
      for (const oneOf of rule.oneOf) {
        if (Array.isArray(oneOf.use)) {
          for (const use of oneOf.use) {
            if (use.loader && use.loader.includes("postcss-loader")) {
              use.options.postcssOptions.plugins = [
                postcssFlexbugsFixes,
                [
                  postcssPresetEnv,
                  {
                    autoprefixer: {
                      flexbox: "no-2009",
                    },
                    stage: 3,
                  },
                ],
                postcssNormalize,
              ];
            }
          }
        }
      }
    }
  }
  return config;
}

module.exports = override(
  addWebpackModuleRule({
    test: /\.tsx?$/,
    use: require.resolve("ts-loader"),
    exclude: /node_modules/,
  }),
  fixPostcssPlugins,
);
