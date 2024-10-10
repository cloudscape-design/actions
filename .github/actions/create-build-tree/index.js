const { buildDependencyGroupsForPackage } = require('./build-tree');

const packageName = process.env.INPUT_PACKAGE;

async function generateBuildMatrix(packageName) {
  const groups = await buildDependencyGroupsForPackage(packageName);
  let matrix = [];

  for (const level in groups) {
    for (const packageName of groups[level]) {
      matrix.push({ package: packageName });
    }
  }

  return matrix;
}

generateBuildMatrix(packageName).then(matrix => console.log(`::set-output name=matrix::${JSON.stringify(matrix)}`));
