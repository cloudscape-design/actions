// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';

// Simplified version of https://github.com/actions/toolkit/blob/main/packages/core/src/core.ts#L192
export function setOutput(name, value) {
  const outputFilePath = process.env.GITHUB_OUTPUT;

  if (!outputFilePath) {
    throw new Error(`Missing file at path: ${outputFilePath}`)
  }

  fs.appendFileSync(outputFilePath, `${name}=${value}\n`)
}