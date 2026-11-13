import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateTopUp } from './laptopValuation.js';

test('buyer owes the difference plus repair deductions', () => {
  assert.equal(estimateTopUp(400000, 230000, 10000), 180000);
});
test('negative top-up means the buyer receives the difference', () => {
  assert.equal(estimateTopUp(230000, 300000, 0), -70000);
});
test('invalid or negative valuation inputs fail safely to zero', () => {
  assert.equal(estimateTopUp('invalid', 120000, 0), 0);
  assert.equal(estimateTopUp(100000, -1, 0), 0);
});
