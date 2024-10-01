import type {Config} from '@jest/types';


const DIR_SRC = 'src/main/resources';
const DIR_SRC_JEST = 'src/jest';
const AND_BELOW = '**';
const SOURCE_FILES = `*.{ts}`;
const TEST_EXT = `test.ts`;
const TEST_FILES = `*.${TEST_EXT}`;


const commonConfig: Config.InitialProjectOptions = {
  collectCoverageFrom: [
    `${DIR_SRC}/${AND_BELOW}/${SOURCE_FILES}`,
  ],

  // coveragePathIgnorePatterns [array<string>]
  // Default: ["/node_modules/"]
  // An array of regexp pattern strings that are matched against all file paths
  // before executing the test. If the file path matches any of the patterns,
  // coverage information will be skipped.
  // These pattern strings match against the full path. Use the <rootDir> string
  // token to include the path to your project's root directory to prevent it
  // from accidentally ignoring all of your files in different environments that
  // may have different root directories.
  // Example: ["<rootDir>/build/", "<rootDir>/node_modules/"].
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    `<rootDir>/${DIR_SRC_JEST}/`,
  ],

  // Insert Jest's globals (expect, test, describe, beforeEach etc.) into the
  // global environment. If you set this to false, you should import from @jest/globals, e.g.
  // injectGlobals: true, // Doesn't seem to work?
};

const serverSideConfig: Config.InitialProjectOptions = {
  ...commonConfig,
  displayName: {
    color: 'blue',
    name: 'SERVER',
  },
  // extensionsToTreatAsEsm: ['.ts'], // Doesn't fix that types/index.d.ts is not treaded as TypeScript

  // A set of global variables that need to be available in all test
  // environments.
  // If you specify a global reference value (like an object or array) here,
  // and some code mutates that value in the midst of running a test, that
  // mutation will not be persisted across test runs for other test files.
  // In addition, the globals object must be json-serializable, so it can't be
  // used to specify global functions. For that, you should use setupFiles.
  globals: {
    app: {
      name: 'com.example.myproject',
      config: {},
      version: '1.0.0',
    },
  },

  // moduleFileExtensions [array<string>]
  // Default: ["js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"]
  // An array of file extensions your modules use. If you require modules
  // without specifying a file extension, these are the extensions Jest will
  // look for, in left-to-right order.
  // We recommend placing the extensions most commonly used in your project on
  // the left, so if you are using TypeScript, you may want to consider moving
  // "ts" and/or "tsx" to the beginning of the array.
  moduleFileExtensions: [
    'ts',
    'js', // Validation Error: moduleFileExtensions must include 'js'
  ],

  // modulePathIgnorePatterns: [
  //   `<rootDir>/${DIR_SRC}/types`
  // ],

  // A map from regular expressions to module names or to arrays of module
  // names that allow to stub out resources, like images or styles with a
  // single module.
  // Use <rootDir> string token to refer to rootDir value if you want to use
  // file paths.
  // Additionally, you can substitute captured regex groups using numbered
  // backreferences.
  moduleNameMapper: {
    // '/types': `<rootDir>/${DIR_SRC}/types/index.d.ts`,
    // '/types/(.*)': `<rootDir>/${DIR_SRC}/types/$1.ts`,
    '/lib/enonic/static/(.*)': `<rootDir>/${DIR_SRC}/lib/enonic/static/$1`,
  },

  // modulePaths: [
  //   `<rootDir>/${DIR_SRC}/`
  // ],

  // preset: 'ts-jest/presets/js-with-babel-legacy', // Doesn't fix that types/index.d.ts is not treaded as TypeScript

  // A list of paths to modules that run some code to configure or set up the
  // testing environment. Each setupFile will be run once per test file. Since
  // every test runs in its own environment, these scripts will be executed in
  // the testing environment before executing setupFilesAfterEnv and before
  // the test code itself.
  setupFiles: [
    `<rootDir>/${DIR_SRC_JEST}/setupFile.ts`,
  ],

  // Run serverside tests without DOM globals such as document and window
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files. By default it looks for
  // .js, .jsx, .ts and .tsx files inside of __tests__ folders, as well as any
  // files with a suffix of .test or .spec (e.g. Component.test.js or
  // Component.spec.js). It will also find files called test.js or spec.js.
  // (default: [
  //   "**/__tests__/**/*.[jt]s?(x)",
  //   "**/?(*.)+(spec|test).[jt]s?(x)"
  // ])
  testMatch: [
    `<rootDir>/${DIR_SRC_JEST}/${AND_BELOW}/${TEST_FILES}`,
  ],

  // transform [object<string, pathToTransformer | [pathToTransformer, object]>]
  // Default: {"\\.[jt]sx?$": "babel-jest"}
  // A map from regular expressions to paths to transformers. Optionally, a
  // tuple with configuration options can be passed as second argument:
  // {filePattern: ['path-to-transformer', {options}]}. For example, here is how
  // you can configure babel-jest for non-default behavior:
  // {'\\.js$': ['babel-jest', {rootMode: 'upward'}]}.
  transform: {
    // "\\.[jt]sx?$": 'ts-jest',
    // "^.+\\.ts$": [
    // ".*": [
    "\\.[jt]sx?$": [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  // transformIgnorePatterns: ['<rootDir>/node_modules/'], // Ignore all node_modules
  // transformIgnorePatterns: [
  //   '!node_modules/'
  // ]

  // unmockedModulePathPatterns [array<string>]
  // Default: []
  // An array of regexp pattern strings that are matched against all modules
  // before the module loader will automatically return a mock for them. If a
  // module's path matches any of the patterns in this list, it will not be
  // automatically mocked by the module loader.
  // unmockedModulePathPatterns: [
    // '/types',
    // `<rootDir>/${DIR_SRC}/types/index.d.ts`
  // ],
};

const customJestConfig: Config.InitialOptions = {
  coverageProvider: 'v8', // To get correct line numbers under jsdom
  // passWithNoTests: true,
  projects: [serverSideConfig],
  // runner: 'jest-runner-tsc'
};

export default customJestConfig;
