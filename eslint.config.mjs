import enonicConfig from '@enonic/eslint-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      // '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
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
