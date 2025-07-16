import { vi, describe, it, expect } from 'vitest';
import { applyRulesets } from '../apply-rulesets.ts';

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

describe(applyRulesets.name, () => {
  it('applies the basic and dry-run rulesets', async () => {
    await applyRulesets();
    expect(mocks.createOrgRuleset.mock.calls).toMatchSnapshot();
  });
});
