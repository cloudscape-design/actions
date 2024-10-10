const { promises: fs } = require('node:fs');
const path = require('node:path');

// Mapping of artifacts to their producing repositories
const artifactToRepositoryMap = {
  '@cloudscape-design/theming-runtime': '@cloudscape-design/theming-core',
  '@cloudscape-design/theming-build': '@cloudscape-design/theming-core',
  '@cloudscape-design/test-utils-core': '@cloudscape-design/test-utils',
};

async function loadDependenciesMap() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'dependencies.json'), { encoding: 'utf-8' });
    const dependenciesMap = JSON.parse(data);

    // Adjust dependencies map to reflect repository names
    const adjustedDependenciesMap = {};
    for (const [repo, dependencies] of Object.entries(dependenciesMap)) {
      adjustedDependenciesMap[artifactToRepositoryMap[repo] || repo] = dependencies.map(
        dep => artifactToRepositoryMap[dep] || dep
      );
    }
    return adjustedDependenciesMap;
  } catch (error) {
    console.error('Failed to load dependencies map:', error);
    return {};
  }
}

async function loadDependentMap() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'dependentMap.json'), { encoding: 'utf-8' });
    const dependentMap = JSON.parse(data);

    // Adjust dependent map to reflect repository names
    const adjustedDependentMap = {};
    for (const [artifact, dependents] of Object.entries(dependentMap)) {
      const repo = artifactToRepositoryMap[artifact] || artifact;
      adjustedDependentMap[repo] = (adjustedDependentMap[repo] || []).concat(
        dependents.map(dep => artifactToRepositoryMap[dep] || dep)
      );
    }
    return adjustedDependentMap;
  } catch (error) {
    console.error('Failed to load dependent map:', error);
    return {};
  }
}

// Other functions remain mostly unchanged, but ensure to reference adjusted maps
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

function determineLevels(dependenciesMap, packagesToConsider) {
  let levels = {};
  let changed = true;

  while (changed) {
    changed = false;
    for (const [packageName, dependencies] of Object.entries(dependenciesMap)) {
      if (!packagesToConsider.has(packageName)) continue;

      let maxLevel = 0;
      for (const dep of dependencies) {
        if (packagesToConsider.has(dep) && levels[dep] !== undefined && levels[dep] >= maxLevel) {
          maxLevel = levels[dep] + 1;
        }
      }

      if (levels[packageName] === undefined || levels[packageName] < maxLevel) {
        levels[packageName] = maxLevel;
        changed = true;
      }
    }
  }

  return levels;
}

async function buildDependencyGroupsForPackage(packageName) {
  const adjustedPackageName = artifactToRepositoryMap[packageName] || packageName;
  const [dependenciesMap, dependentMap] = await Promise.all([loadDependenciesMap(), loadDependentMap()]);
  const packagesToRebuild = collectAllDependents(adjustedPackageName, dependentMap, new Set([adjustedPackageName]));
  const levels = determineLevels(dependenciesMap, packagesToRebuild);
  const groups = {};

  for (const [packageName, level] of Object.entries(levels)) {
    if (!groups[level]) {
      groups[level] = [];
    }

    groups[level].push(packageName);
  }

  return groups;
}

module.exports = { buildDependencyGroupsForPackage };
