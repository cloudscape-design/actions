// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');

const core = require('./core');

const rootPath = core.getInput('path');
const tarballDir = core.getInput('tarball-dir');
const buildToolsRef = core.getInput('build-tools-ref');
const buildToolsRepository = core.getInput('build-tools-repository') || 'cloudscape-design/build-tools';

const packageJsonFullPath = path.resolve(path.join(rootPath, 'package.json'));
const tarballDirFullPath = path.resolve(tarballDir);

if (!fs.existsSync(packageJsonFullPath)) {
  throw new Error(`package.json not found at path: ${packageJsonFullPath}`);
}

const packageJsonData = JSON.parse(fs.readFileSync(packageJsonFullPath, 'utf8'));
const tarballFiles = fs.existsSync(tarballDirFullPath)
  ? fs.readdirSync(tarballDirFullPath).filter(file => file.endsWith('.tgz'))
  : [];

const updateCloudscapeDependencies = dependencies => {
  if (!dependencies) return {};

  dependencies = Object.keys(dependencies).reduce((updatedDeps, key) => {
    if (key.startsWith('@cloudscape-design/')) {
      const tarball = tarballFiles.find(file => file.replace('cloudscape-design-', '').startsWith(key.replace('@cloudscape-design/', '')));
      if (tarball) {
        console.log(`Updating ${key} to tarball file: ${tarball}`);
        updatedDeps[key] = `file:${path.join(tarballDirFullPath, tarball)}`;
      } else {
        console.log(`No tarball found for ${key}, skipping update.`);
        updatedDeps[key] = dependencies[key];
      }
    } else {
      updatedDeps[key] = dependencies[key];
    }
    return updatedDeps;
  }, {});

  // build-tools is consumed via a `github:` reference (it ships no build artifact / tarball),
  // so it can't be swapped in through the tarball mechanism above. When the dry-run originates
  // from a build-tools PR, re-point that reference at the repository and branch/SHA under test so
  // downstream packages install the PR version instead of `#main`. The repository matters because
  // a forked pull request's branch does not exist in the upstream repository.
  if (buildToolsRef && dependencies['@cloudscape-design/build-tools']) {
    const buildToolsReference = `github:${buildToolsRepository}#${buildToolsRef}`;
    console.log(`Updating @cloudscape-design/build-tools to dry-run ref: ${buildToolsReference}`);
    dependencies['@cloudscape-design/build-tools'] = buildToolsReference;
  }

  return dependencies;
};

packageJsonData.dependencies = updateCloudscapeDependencies(packageJsonData.dependencies);
packageJsonData.devDependencies = updateCloudscapeDependencies(packageJsonData.devDependencies);

fs.writeFileSync(packageJsonFullPath, JSON.stringify(packageJsonData, null, 2));

console.log(`Successfully updated @cloudscape-design/* dependencies to point to local tarballs.`);
