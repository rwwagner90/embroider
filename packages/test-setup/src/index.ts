import type { Options } from '@embroider/compat';

/*
  Use this instead of `app.toTree()` in your ember-cli-build.js:

    return maybeEmbroider(app);

*/
export function maybeEmbroider(app: any, opts: Options = {}) {
  if (!('@embroider/core' in app.dependencies())) {
    return app.toTree(opts?.extraPublicTrees);
  }

  // we're using `require` here on purpose because
  //  - we don't want to load any of these things until they're actually needed;
  //  - we can't use `await import()` because this function needs to be synchronous to go inside ember-cli-build.js
  /* eslint-disable @typescript-eslint/no-require-imports */
  let resolve = require('resolve') as typeof import('resolve');
  let { Webpack } = require(resolve.sync('@embroider/webpack', {
    basedir: app.project.root,
  })) as typeof import('@embroider/webpack');
  let Compat = require(resolve.sync('@embroider/compat', {
    basedir: app.project.root,
  })) as typeof import('@embroider/compat');
  let mergeWith = require('lodash/mergeWith') as typeof import('lodash/mergeWith');
  /* eslint-enable @typescript-eslint/no-require-imports */

  if (process.env.EMBROIDER_TEST_SETUP_OPTIONS) {
    let scenario = Compat.recommendedOptions[process.env.EMBROIDER_TEST_SETUP_OPTIONS];
    if (scenario) {
      opts = mergeWith({}, scenario, opts, appendArrays);
      console.log(`Successfully applied EMBROIDER_TEST_SETUP_OPTIONS=${process.env.EMBROIDER_TEST_SETUP_OPTIONS}`);
    } else {
      throw new Error(`No such scenario EMBROIDER_TEST_SETUP_OPTIONS=${process.env.EMBROIDER_TEST_SETUP_OPTIONS}`);
    }
  }

  return Compat.compatBuild(app, Webpack, opts);
}

export function embroiderSafe(extension?: object) {
  return extendScenario(
    {
      name: 'embroider-safe',
      npm: {
        devDependencies: {
          '@embroider/core': '*',
          '@embroider/webpack': '*',
          '@embroider/compat': '*',
        },
      },
      env: {
        EMBROIDER_TEST_SETUP_OPTIONS: 'safe',
      },
    },
    extension
  );
}

export function embroiderOptimized(extension?: object) {
  return extendScenario(
    {
      name: 'embroider-optimized',
      npm: {
        devDependencies: {
          '@embroider/core': '*',
          '@embroider/webpack': '*',
          '@embroider/compat': '*',
        },
      },
      env: {
        EMBROIDER_TEST_SETUP_OPTIONS: 'optimized',
      },
    },
    extension
  );
}

function extendScenario(scenario: object, extension?: object) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  let mergeWith = require('lodash/mergeWith') as typeof import('lodash/mergeWith');
  return mergeWith(scenario, extension, appendArrays);
}

function appendArrays(objValue: any, srcValue: any) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }
}
