#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');

/**
 * Remove specific @cloudscape-design/* packages where we should always use the latest minor release.
 */
const filename = path.resolve(process.env.GITHUB_WORKSPACE, 'package-lock.json');
const packageLock = JSON.parse(fs.readFileSync(filename));

function removeDependencies(dependencies) {
  Object.keys(dependencies).forEach(dependencyName => {
    if (dependencyName.includes('@cloudscape-design/')) {
      delete dependencies[dependencyName];
    }
  });
}

if (packageLock.lockfileVersion === 2 || packageLock.lockfileVersion === 3) {
  // Apply deletion function to both packages and dependencies (if v2)
  removeDependencies(packageLock.packages);
  if (packageLock.lockfileVersion === 2) {
    removeDependencies(packageLock.dependencies);
  }
} else {
  throw new Error(`Unsupported lockfileVersion: ${packageLock.lockfileVersion}`);
}

fs.writeFileSync(filename, JSON.stringify(packageLock, null, 2) + '\n');
console.log('Removed @cloudscape-design/ dependencies from package-lock file');
