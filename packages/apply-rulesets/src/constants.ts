import type { CloudscapeRepo } from './types.js';

export const GH_ORG = 'cloudscape-design';

/*
 * Checks that are applied to every repository under `cloudscape-design` organization.
 */
export const BASIC_CHECKS = ['build / build', 'build / codeql', 'build / git-secrets'];

/*
 * Checks that are applied to repositories specified in `CODECOV_REPOS`.
 */
export const CODECOV_CHECKS = ['codecov/patch', 'codecov/project'];

/*
 * Checks that are applied to repositories specified in `DRY_RUN_REPOS` constant.
 */
export const DRY_RUN_CHECKS = [
  'dry-run / Build board components',
  'dry-run / Build browser-test-tools',
  'dry-run / Build chat components',
  'dry-run / Build code view components',
  'dry-run / Build collection-hooks',
  'dry-run / Build component-toolkit',
  'dry-run / Build components',
  'dry-run / Build documenter',
  'dry-run / Build global-styles',
  'dry-run / Build jest-preset',
  'dry-run / Build test-utils',
  'dry-run / Build theming-core',
  'dry-run / Components accessibility tests shards (1)',
  'dry-run / Components accessibility tests shards (2)',
  'dry-run / Components accessibility tests shards (3)',
  'dry-run / Components accessibility tests shards (4)',
  'dry-run / Components accessibility tests shards (5)',
  'dry-run / Components accessibility tests shards (6)',
  'dry-run / Components integration tests shards (React 16, 1)',
  'dry-run / Components integration tests shards (React 16, 2)',
  'dry-run / Components integration tests shards (React 16, 3)',
  'dry-run / Components integration tests shards (React 16, 4)',
  'dry-run / Components integration tests shards (React 18, 1)',
  'dry-run / Components integration tests shards (React 18, 2)',
  'dry-run / Components integration tests shards (React 18, 3)',
  'dry-run / Components integration tests shards (React 18, 4)',
  'dry-run / Components motion tests (React 16)',
  'dry-run / Components motion tests (React 18)',
  'dry-run / Components unit tests',
  'dry-run / Create build tree',
  'dry-run / Demos tests',
  'dry-run / Validate PR title',
];

/**
 * Repositories that `CODECOV_CHECKS` will be applied to.
 * These checks will be applied in addition to the `BASIC_CHECKS`.
 */
export const CODECOV_REPOS: CloudscapeRepo[] = [
  'board-components',
  'browser-test-tools',
  'code-view',
  'component-toolkit',
  'components',
  'documenter',
  'theming-core',
];

/*
 * Repositories that `DRY_RUN_CHECKS` will be applied to.
 * These checks will be applied in addition to the `BASIC_CHECKS`.
 */
export const DRY_RUN_REPOS: CloudscapeRepo[] = [
  'board-components',
  'browser-test-tools',
  'build-tools',
  'chart-components',
  'chat-components',
  'code-view',
  'collection-hooks',
  'component-toolkit',
  'components',
  'documenter',
  'global-styles',
  'jest-preset',
  'test-utils',
  'theming-core',
];

export const MERGE_QUEUE_REPOS: CloudscapeRepo[] = [
  'board-components',
  'browser-test-tools',
  'build-tools',
  'chart-components',
  'chat-components',
  'code-view',
  'collection-hooks',
  'component-toolkit',
  'components',
  'demos',
  'documenter',
  'global-styles',
  'jest-preset',
  'test-utils',
  'theming-core',
];
