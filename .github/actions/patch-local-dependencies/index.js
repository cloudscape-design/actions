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

// The package under test in a dry-run, and the commit to pin it to. When a
// consumer references the changed package via a `github:<repo>#<ref>` git URL
// (e.g. build-tools, which publishes no tarball), swap the ref to the PR commit
// so the consumer resolves against the PR's manifest instead of live main.
const changedRepo = process.env.DRY_RUN_CHANGED_REPO || '';
const changedRef = process.env.DRY_RUN_CHANGED_SHA || '';

const repinGitRefToChangedCommit = value => {
  if (!changedRepo || !changedRef) return null;
  const match = /^github:([^#]+)(?:#.*)?$/.exec(value);
  if (!match || match[1] !== changedRepo) return null;
  return `github:${changedRepo}#${changedRef}`;
};

const updateCloudscapeDependencies = dependencies => {
  if (!dependencies) return {};
  return Object.keys(dependencies).reduce((updatedDeps, key) => {
    if (key.startsWith('@cloudscape-design/')) {
      const tarball = tarballFiles.find(file => file.replace('cloudscape-design-', '').startsWith(key.replace('@cloudscape-design/', '')));
      if (tarball) {
        console.log(`Updating ${key} to tarball file: ${tarball}`);
        updatedDeps[key] = `file:${path.join(tarballDirFullPath, tarball)}`;
      } else {
        const repinned = repinGitRefToChangedCommit(dependencies[key]);
        if (repinned) {
          console.log(`Pinning ${key} git ref to changed commit: ${repinned}`);
          updatedDeps[key] = repinned;
        } else {
          console.log(`No tarball found for ${key}, skipping update.`);
          updatedDeps[key] = dependencies[key];
        }
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
