import { createOrUpdateRuleset, type RulesetParams } from '../create-or-update-ruleset.ts';
import { describe, expect, it, vi } from 'vitest';
import { Octokit } from '@octokit/rest';
import { GH_ORG } from '../constants.ts';

vi.stubEnv('GH_ORG_TOKEN', 'test-github-token');

const mocks = vi.hoisted(() => ({
  getOrgRulesets: vi.fn().mockResolvedValue({ data: [] }),
  updateOrgRuleset: vi.fn(),
  createOrgRuleset: vi.fn(),
}));
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockReturnValue({
    rest: {
      repos: {
        getOrgRulesets: mocks.getOrgRulesets,
        updateOrgRuleset: mocks.updateOrgRuleset,
        createOrgRuleset: mocks.createOrgRuleset,
      },
    },
  }),
}));

const testParams: RulesetParams = {
  name: 'test ruleset name',
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
};

describe(createOrUpdateRuleset.name, () => {
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
        name: testParams.name,
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

      await createOrUpdateRuleset(testParams);

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
