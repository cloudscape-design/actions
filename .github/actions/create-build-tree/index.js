// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { createBuildTree } from './build-tree.js';
import { setOutput } from './core.js';

const repoName = process.env.INPUT_PACKAGE;

if (!repoName) {
  throw new Error('Missing input: package');
}

async function generateBuildMatrix(repoName) {
  console.log('Creating dependency groups for repo', repoName);
  const buildTree = await createBuildTree(repoName);
  return buildTree;
}

generateBuildMatrix(repoName).then(({ repositories }) => {
  console.log("Build tree", repositories);
  setOutput('repositories', JSON.stringify(repositories));
});