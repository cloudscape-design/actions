// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { promises as fs } from 'node:fs';
import path from 'node:path';

const artifactToRepositoryMap = {
  'cloudscape-design/theming-runtime': 'cloudscape-design/theming-core',
  'cloudscape-design/theming-build': 'cloudscape-design/theming-core',
  'cloudscape-design/test-utils-core': 'cloudscape-design/test-utils',
};

async function loadDependentMap() {
  const data = await fs.readFile(path.join(import.meta.dirname, 'generated', 'dependents.json'), { encoding: 'utf-8' });
  const dependentMap = JSON.parse(data);

  const adjustedDependentMap = {};
  for (const [artifact, dependents] of Object.entries(dependentMap)) {
    const repo = artifactToRepositoryMap[artifact] || artifact;
    adjustedDependentMap[repo] = (adjustedDependentMap[repo] || []).concat(
      dependents.map(dep => artifactToRepositoryMap[dep] || dep)
    );
  }
  return adjustedDependentMap;
}

function collectAllDependents(packageName, dependentMap, collected) {
  if (dependentMap.hasOwnProperty(packageName)) {
    for (const dependent of dependentMap[packageName]) {
      if (!collected.has(dependent)) {
        collected.add(dependent);
        collectAllDependents(dependent, dependentMap, collected);
      }
    }
  }
  return collected;
}

export async function createBuildTree(packageName) {
  const dependentMap = await loadDependentMap();
  const adjustedPackageName = artifactToRepositoryMap[packageName] || packageName;

  const repositories = [...collectAllDependents(adjustedPackageName, dependentMap, new Set([adjustedPackageName]))];

  return { repositories };
}
