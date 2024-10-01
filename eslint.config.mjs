import enonicConfig from '@enonic/eslint-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const LEVEL = 'warn';
const LEVEL = 'off';

export default [
  ...enonicConfig,
  {
    languageOptions: {
      parserOptions: {
        // project: true, // Doesn't work with tsconfig references
        project: [
          // "./tsconfig.json", // Doesn't work with tsconfig references
          "./tsconfig.node.json",
          "./tsconfig.bun.json",
          "./tsconfig.jest.json",
          "./tsconfig.xp.json"
        ],
        tsconfigRootDir: __dirname,
      }
    },
    rules: {
      '@typescript-eslint/no-namespace': [
        'error',
        {
          allowDeclarations: true,
          // allowDefinitionFiles: true,
        },
      ],
      '@typescript-eslint/no-redundant-type-constituents': LEVEL,
      // '@typescript-eslint/no-unnecessary-type-assertion': LEVEL,
      '@typescript-eslint/no-unsafe-assignment': LEVEL,
      '@typescript-eslint/no-unsafe-call': LEVEL,
      '@typescript-eslint/no-unsafe-member-access': LEVEL,
      '@typescript-eslint/no-unsafe-return': LEVEL,
    }
  },
  {
    ignores: [
      "bin/**/*",
      "build/**/*",
      "coverage/**/*",
      "node_modules/**/*",

      // TODO:
      "src/jest/**/*",
      "src/test/**/*",
      "src/main/resources/**/*.d.ts",
      "tsup/**/*.d.ts",

      // These cause: Parsing error: "parserOptions.project" has been provided for @typescript-eslint/parser
      "eslint.config.mjs",
    ]
  }
];
