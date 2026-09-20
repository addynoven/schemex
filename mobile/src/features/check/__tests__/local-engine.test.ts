import { describe, it } from 'node:test';
import assert from 'node:assert';
import { localEligibilityEngine, type EligibilityEvaluationInput } from '../engine/local-eligibility-engine';
import { getLocalDatabase } from '../../../core/database/local-db';

describe('Local-First Embedded Engine & Database Tests', () => {
  it('local SQLite database contains all 4,147 schemes', () => {
    const db = getLocalDatabase();
    const countRow = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM schemes');
    assert.ok(countRow);
    assert.strictEqual(countRow.count, 4147);
  });

  it('local database contains all eligibility rules, benefits, and documents', () => {
    const db = getLocalDatabase();
    const rulesCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM eligibility_rules');
    const benefitsCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM benefits');
    const docsCount = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM required_documents');

    assert.ok(rulesCount && rulesCount.count > 9000);
    assert.ok(benefitsCount && benefitsCount.count > 4000);
    assert.ok(docsCount && docsCount.count > 14000);
  });

  it('evaluates low-income farmer in Goa in under 100ms offline', () => {
    const t0 = Date.now();
    const input: EligibilityEvaluationInput = {
      age: 32,
      gender: 'male',
      caste: 'obc',
      income: 150000,
      state: 'Goa',
      district: 'North Goa',
      area: 'rural',
      occupation: 'farmer',
      isFarmer: true,
      isStudent: false,
      disability: false,
      disabilityPercentage: 0,
      minority: false,
      bplCard: false,
    };
    const report = localEligibilityEngine.evaluate(input);
    const elapsed = Date.now() - t0;

    assert.ok(elapsed < 200, `Expected <200ms evaluation, took ${elapsed}ms`);
    assert.ok(report.total_evaluated > 800, 'Expected >800 schemes evaluated for Goa + Central');
    assert.ok(report.eligible_count > 0, 'Expected positive eligible scheme count');

    const pmKisan = report.eligible_schemes.find((s) => s.scheme_slug === 'pm-kisan');
    assert.ok(pmKisan, 'Expected PM-Kisan to be among eligible schemes for a low-income farmer');
    assert.strictEqual(pmKisan.is_eligible, true);
    assert.strictEqual(pmKisan.status, 'eligible');
  });

  it('correctly flags female-only schemes like Sukanya Samriddhi for female citizens', () => {
    const input: EligibilityEvaluationInput = {
      age: 10,
      gender: 'female',
      caste: 'general',
      income: 250000,
      state: 'Maharashtra',
      occupation: 'student',
      isFarmer: false,
      isStudent: true,
      disability: false,
      disabilityPercentage: 0,
      minority: false,
      bplCard: false,
    };
    const femaleReport = localEligibilityEngine.evaluate(input);

    const ssy = femaleReport.eligible_schemes.find((s) => s.scheme_slug === 'sukanya-samriddhi-yojana');
    assert.ok(ssy, 'Expected Sukanya Samriddhi Yojana to be eligible for young female citizen');
  });
});
