import enonicConfig from '@enonic/eslint-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LEVEL = 'warn';

export default [
  ...enonicConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
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
      // '@typescript-eslint/no-unnecessary-type-assertion': LEVEL,
      '@typescript-eslint/no-unsafe-assignment': LEVEL,
      '@typescript-eslint/no-unsafe-call': LEVEL,
      '@typescript-eslint/no-unsafe-member-access': LEVEL,
      '@typescript-eslint/no-unsafe-return': LEVEL,
    }
  },
  {
    ignores: [
      "build/**/*",
      "coverage/**/*",
      "node_modules/**/*",

      // TODO:
      // "src/bun/**/*",
      "src/jest/**/*",
      "src/test/**/*",
      "src/main/resources/**/*.d.ts",
      "tsup/**/*.d.ts",

      // These cause: Parsing error: "parserOptions.project" has been provided for @typescript-eslint/parser
      "eslint.config.mjs",
      "tsup.config.ts",
      "bin/**/*",
    ]
  }
];
