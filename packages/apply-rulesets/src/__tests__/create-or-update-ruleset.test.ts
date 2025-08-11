import { createOrUpdateRuleset, type RulesetParams } from '../create-or-update-ruleset.ts';
import { describe, expect, it, vi } from 'vitest';
import { Octokit } from '@octokit/rest';
import { GH_ORG } from '../constants.ts';

vi.stubEnv('GH_ORG_TOKEN', 'test-github-token');

const mocks = vi.hoisted(() => ({
  getOrgRulesets: vi.fn().mockResolvedValue({ data: [] }),
  updateOrgRuleset: vi.fn(),
  createOrgRuleset: vi.fn(),
  getRepoRulesets: vi.fn().mockResolvedValue({ data: [] }),
  updateRepoRuleset: vi.fn(),
  createRepoRuleset: vi.fn(),
}));
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockReturnValue({
    rest: {
      repos: {
        getOrgRulesets: mocks.getOrgRulesets,
        updateOrgRuleset: mocks.updateOrgRuleset,
        createOrgRuleset: mocks.createOrgRuleset,
        getRepoRulesets: mocks.getRepoRulesets,
        updateRepoRuleset: mocks.updateRepoRuleset,
        createRepoRuleset: mocks.createRepoRuleset,
      },
    },
  }),
}));

function createTestParams(overrides: Partial<RulesetParams> = {}): RulesetParams {
  return {
    name: 'test ruleset name',
    level: 'org',
    repos: ['repo-A', 'repo-B'],
    rules: [
      {
        type: 'required_status_checks',
      },
      {
        type: 'deletion',
      },
      {
        type: 'workflows',
      },
    ],
    ...overrides,
  };
}

describe(createOrUpdateRuleset.name, () => {
  describe('when ruleset type is org', () => {
    const testParams = createTestParams({ level: 'org' });

    it('authenticates using the specified Github token', async () => {
      await createOrUpdateRuleset(testParams);

      expect(Octokit).toHaveBeenCalledWith({
        auth: 'test-github-token',
      });
    });

    describe('when ruleset does not exist', () => {
      it('creates a new ruleset with the specified name and rules', async () => {
        await createOrUpdateRuleset(testParams);

        expect(mocks.createOrgRuleset).toHaveBeenCalledWith({
          name: 'test ruleset name',
          org: GH_ORG,
          target: 'branch',
          conditions: {
            ref_name: {
              include: ['~DEFAULT_BRANCH'],
              exclude: [],
            },
            repository_name: {
              include: testParams.repos,
              exclude: [],
            },
          },
          enforcement: 'active',
          rules: testParams.rules,
        });
      });
    });

    describe('when ruleset exists', () => {
      it('updates the existing ruleset with the specified name and rules', async () => {
        mocks.getOrgRulesets.mockResolvedValueOnce({
          data: [
            {
              id: 123456,
              name: 'test ruleset name',
            },
          ],
        });

        await createOrUpdateRuleset(createTestParams({ level: 'org' }));

        expect(mocks.updateOrgRuleset).toHaveBeenCalledWith({
          name: testParams.name,
          ruleset_id: 123456,
          org: GH_ORG,
          target: 'branch',
          conditions: {
            ref_name: {
              include: ['~DEFAULT_BRANCH'],
              exclude: [],
            },
            repository_name: {
              include: testParams.repos,
              exclude: [],
            },
          },
          enforcement: 'active',
          rules: testParams.rules,
        });
      });
    });
  });

  describe('when ruleset type is repo', () => {
    const testParams = createTestParams({ level: 'repo' });

    it('authenticates using the specified Github token', async () => {
      await createOrUpdateRuleset(createTestParams({ level: 'repo' }));

      expect(Octokit).toHaveBeenCalledWith({
        auth: 'test-github-token',
      });
    });

    describe('when ruleset does not exist', () => {
      it('creates a new ruleset with the specified name and rules', async () => {
        await createOrUpdateRuleset(testParams);

        const baseRuleset = {
          name: testParams.name,
          owner: GH_ORG,
          target: 'branch',
          conditions: {
            ref_name: {
              include: ['~DEFAULT_BRANCH'],
              exclude: [],
            },
          },
          enforcement: 'active',
          rules: testParams.rules,
        };

        expect(mocks.createRepoRuleset).toHaveBeenCalledWith({ ...baseRuleset, repo: 'repo-A' });
        expect(mocks.createRepoRuleset).toHaveBeenCalledWith({ ...baseRuleset, repo: 'repo-B' });
      });
    });

    describe('when ruleset exists', () => {
      it('updates the existing ruleset with the specified name and rules', async () => {
        mocks.getRepoRulesets
          // Rulesets for the first repo: repo-A
          .mockResolvedValueOnce({
            data: [
              {
                id: 11,
                name: 'test ruleset name',
              },
            ],
          })
          // Rulesets for the first repo: repo-B
          .mockResolvedValueOnce({
            data: [
              {
                id: 22,
                name: 'test ruleset name',
              },
            ],
          });

        await createOrUpdateRuleset(createTestParams({ level: 'repo' }));

        const baseRuleset = {
          name: 'test ruleset name',
          owner: GH_ORG,
          target: 'branch',
          conditions: {
            ref_name: {
              include: ['~DEFAULT_BRANCH'],
              exclude: [],
            },
          },
          enforcement: 'active',
          rules: testParams.rules,
        };

        expect(mocks.updateRepoRuleset).toHaveBeenCalledWith({
          ...baseRuleset,
          repo: 'repo-A',
          ruleset_id: 11,
        });
        expect(mocks.updateRepoRuleset).toHaveBeenCalledWith({
          ...baseRuleset,
          repo: 'repo-B',
          ruleset_id: 22,
        });
      });
    });

    describe('when rulesets for some of the repos dont exist', () => {
      it('create the ruleset for the non-existing ones and update the existing ones', async () => {
        mocks.getRepoRulesets
          // No rulesets for the first repo: repo-A
          .mockResolvedValueOnce({
            data: [],
          })
          // Existing ruleset for the first repo: repo-B
          .mockResolvedValueOnce({
            data: [
              {
                id: 22,
                name: 'test ruleset name',
              },
            ],
          });

        await createOrUpdateRuleset(createTestParams({ level: 'repo' }));

        const baseRuleset = {
          name: 'test ruleset name',
          owner: GH_ORG,
          target: 'branch',
          conditions: {
            ref_name: {
              include: ['~DEFAULT_BRANCH'],
              exclude: [],
            },
          },
          enforcement: 'active',
          rules: testParams.rules,
        };

        expect(mocks.createRepoRuleset).toHaveBeenCalledWith({
          ...baseRuleset,
          repo: 'repo-A',
        });
        expect(mocks.updateRepoRuleset).toHaveBeenCalledWith({
          ...baseRuleset,
          repo: 'repo-B',
          ruleset_id: 22,
        });
      });
    });
  });
});
