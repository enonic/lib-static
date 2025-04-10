import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import {join} from 'path';
import {exit} from 'process';
import propertiesReader from 'properties-reader';
import packageLockJson from '../package-lock.json';

let ENONIC_TYPES_CORE_VERSION = packageLockJson.packages['node_modules/@enonic-types/core'].version;
if (!ENONIC_TYPES_CORE_VERSION.startsWith('^')) {
  ENONIC_TYPES_CORE_VERSION = `^${ENONIC_TYPES_CORE_VERSION}`;
}
console.info('@enonic-types/core', ENONIC_TYPES_CORE_VERSION);

function readGradleProperty(filePath: string, propertyName: string): string | null | undefined {
  try {
    const properties = propertiesReader(filePath);
    const propertyValue = properties.get(propertyName) as string | null;
    return propertyValue;
  } catch (error) {
    console.error(`Error reading Gradle property: ${error}`);
    return undefined;
  }
}

function replaceInFile(filePath: string, searchValue: string, replaceValue: string): void {
  const content = readFileSync(filePath, 'utf8');
  const updatedContent = content.replace(new RegExp(searchValue, 'g'), replaceValue);
  writeFileSync(filePath, updatedContent, 'utf8');
}

function replaceInDir(dir: string, searchValue: string, replaceValue: string): void {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      replaceInDir(filePath, searchValue, replaceValue);
    } else {
      replaceInFile(filePath, searchValue, replaceValue);
    }
  });
}

function prefixFile(filePath: string, message: string): void {
  const content = readFileSync(filePath, 'utf8');
  const updatedContent = `${message}\n${content}`;
  writeFileSync(filePath, updatedContent, 'utf8');
}

function copyFile(from: string, to: string): void {
  writeFileSync(to, readFileSync(from, 'utf8'), 'utf8');
}

function copyReplaceAndRename(from: string, to: string, searchValue: string, replaceValue: string): void {
  const content = readFileSync(from, 'utf8');
  const updatedContent = content.replace(new RegExp(searchValue, 'g'), replaceValue);
  writeFileSync(to, updatedContent, 'utf8');
}

replaceInDir('./build/types', '/lib/enonic/static', '.');

// This must come after the replaceInDir calls, or /lib/enonic/static will be replaced with . in the README.md file
copyFile('types/README.md', 'build/types/README.md');

// In order to use the type packages, one has to configure this paths in tsconfig.json:
// "/lib/enonic/static": ["./node_modules/@enonic-types/lib-static"]
// At that point I don't see what the mapping in XpLibraries is good for...
//
// prefixFile('build/types/index.d.ts', `declare global {
//   interface XpLibraries {
//     '/lib/enonic/static': typeof import('./index');
//   }
// }`);

const version = readGradleProperty('gradle.properties', 'version');

if (version) {
  copyReplaceAndRename('types/package.template.json', 'build/types/package.json', '%VERSION%', version);
} else {
  console.error('Unable to read version from gradle.properties!!!');
  exit(1);
}

if (ENONIC_TYPES_CORE_VERSION) {
  copyReplaceAndRename('build/types/package.json', 'build/types/package.json', '%ENONIC_TYPES_CORE_VERSION%', ENONIC_TYPES_CORE_VERSION);
} else {
  console.error('Unable to read @enonic-types/core from package-lock.json!!!');
  exit(1);
}


