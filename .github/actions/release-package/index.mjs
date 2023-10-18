import path from 'path';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const inputs = {
  path: process.env.INPUT_PATH,
  suffix: process.env.INPUT_SUFFIX,
  publishPackages: process.env.PUBLISH_PACKAGES ? process.env.PUBLISH_PACKAGES.split(',').map(pkg => pkg.trim()) : null,
  commitSha: process.env.COMMIT_SHA,
};

console.log('Inputs:');
console.log(JSON.stringify(inputs, null, 2));

const internalFolderName = 'internal';

// The main branch should publish to next, and dev forks to next-dev
const branchName = process.env.GITHUB_REF_TYPE === 'branch' ? process.env.GITHUB_REF_NAME : '';
const publishTag = branchName.startsWith('dev-v3-') ? branchName : 'next';

function releasePackage(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');

  // Update version in the package.json file
  const packageJson = JSON.parse(readFileSync(packageJsonPath));
  packageJson.version += inputs.suffix;

  // Add internal folder to files in package.json
  if (packageJson.files) {
    packageJson.files.push(internalFolderName);
  }

  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Publish to CodeArtifact
  console.info(`Publishing package ${packageJson.name} version ${packageJson.version} to dist-tag ${publishTag}`);

  execSync(`npm publish --tag ${publishTag}`, {
    stdio: 'inherit',
    cwd: packagePath,
  });
}

function addManifest(data, packagePath) {
  mkdirSync(path.join(packagePath, internalFolderName), { recursive: true });
  writeFileSync(path.join(packagePath, internalFolderName, 'manifest.json'), JSON.stringify(data, null, 2));
}

function main() {
  const basePath = inputs.path;

  if (!basePath && !existsSync(basePath)) {
    console.error(`Invalid path: ${basePath}`);
    process.exit(1);
  }

  if (!inputs.suffix) {
    console.error('No version suffix provided.');
    process.exit(1);
  }

  const packagesToPublish = inputs.publishPackages ?? ['.'];

  for (const pkg of packagesToPublish) {
    const packagePath = path.join(basePath, pkg);
    addManifest({ commit: inputs.commitSha }, packagePath);
    releasePackage(packagePath);
  }
}

main();
