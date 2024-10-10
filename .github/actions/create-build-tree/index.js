const fs = require('node:fs');
const { buildDependencyGroupsForPackage } = require('./build-tree');

const repoName = process.env.INPUT_PACKAGE;

if (!repoName) {
  throw new Error('Missing input: package');
}

async function generateBuildMatrix(repoName) {
  console.log('Creating dependency groups for repo', repoName);
  const packageName = `@${repoName}`;
  const groups = await buildDependencyGroupsForPackage(packageName);
  let matrix = [];

  for (const level in groups) {
    for (const packageName of groups[level]) {
      matrix.push({ package: packageName });
    }
  }

  return matrix;
}

generateBuildMatrix(repoName).then(matrix => {
  const outputFilePath = process.env.GITHUB_OUTPUT;

  if (!outputFilePath) {
    throw new Error(`Missing file at path: ${outputFilePath}`)
  }

  const output = JSON.stringify(matrix);
  console.log('Build matrix json', output);
  fs.appendFileSync(outputFilePath, `matrix=${output}\n`, { encoding: 'utf8' });
});
