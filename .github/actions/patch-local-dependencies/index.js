// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');

const core = require('./core');

const rootPath = core.getInput('path');
const tarballDir = core.getInput('tarball-dir');

const packageJsonFullPath = path.resolve(path.join(rootPath, 'package.json'));
const tarballDirFullPath = path.resolve(tarballDir);

if (!fs.existsSync(tarballDirFullPath)) {
  console.log('No local tarball directory found. No local dependencies will be loaded.');
  return;
}

if (!fs.existsSync(packageJsonFullPath)) {
  throw new Error(`package.json not found at path: ${packageJsonFullPath}`);
}

const packageJsonData = JSON.parse(fs.readFileSync(packageJsonFullPath, 'utf8'));
const tarballFiles = fs.readdirSync(tarballDirFullPath).filter(file => file.endsWith('.tgz'));

const updateCloudscapeDependencies = dependencies => {
  if (!dependencies) return {};
  return Object.keys(dependencies).reduce((updatedDeps, key) => {
    if (key.startsWith('@cloudscape-design/')) {
      const tarball = tarballFiles.find(file => file.includes(key.replace('@cloudscape-design/', '')));
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
};

packageJsonData.dependencies = updateCloudscapeDependencies(packageJsonData.dependencies);
packageJsonData.devDependencies = updateCloudscapeDependencies(packageJsonData.devDependencies);

fs.writeFileSync(packageJsonFullPath, JSON.stringify(packageJsonData, null, 2));

console.log(`Successfully updated @cloudscape-design/* dependencies to point to local tarballs.`);
