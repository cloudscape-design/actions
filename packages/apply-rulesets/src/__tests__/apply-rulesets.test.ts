import { vi, describe, it, expect } from 'vitest';
import { applyRulesets } from '../apply-rulesets.ts';

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

describe(applyRulesets.name, () => {
  it('applies all of the rulesets', async () => {
    await applyRulesets();
    expect(mocks.createOrgRuleset.mock.calls).toMatchSnapshot();
    expect(mocks.createRepoRuleset.mock.calls).toMatchSnapshot();
  });
});
