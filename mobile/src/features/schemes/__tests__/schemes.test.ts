import { describe, it } from 'node:test';
import assert from 'node:assert';
import { filterSchemesList, useSchemesStore } from '../store/useSchemesStore';
import type { SchemeItem } from '../models/schemes.model';

const SAMPLE_SCHEMES: SchemeItem[] = [
  {
    id: 'pm-kisan',
    title: 'PM Kisan Samman Nidhi',
    ministry: 'Ministry of Agriculture',
    benefitAmount: '₹6,000 / year',
    benefitSummary: 'Direct income support of ₹6,000 per year to farmers.',
    jurisdiction: 'All India',
    category: 'agriculture',
    benefitType: 'cash_grant',
    tags: ['All India', 'Farmer', 'Direct Benefit'],
    description: 'Income support to farmer families.',
    launchDate: '2019',
    officialUrl: 'https://pmkisan.gov.in',
    isBookmarked: false,
  },
  {
    id: 'pm-ujjwala',
    title: 'PM Ujjwala Yojana',
    ministry: 'Ministry of Petroleum',
    benefitAmount: 'Free LPG Connection',
    benefitSummary: 'Clean cooking fuel to rural women.',
    jurisdiction: 'All India',
    category: 'women',
    benefitType: 'subsidy',
    tags: ['All India', 'Subsidy', 'Clean Energy'],
    description: 'Deposit-free LPG connection to women.',
    launchDate: '2016',
    officialUrl: 'https://pmuy.gov.in',
    isBookmarked: false,
  },
  {
    id: 'kcc',
    title: 'Kisan Credit Card (KCC)',
    ministry: 'Ministry of Agriculture',
    benefitAmount: 'Up to ₹3,00,000',
    benefitSummary: 'Concessional credit access to farmers at subsidized rates.',
    jurisdiction: 'All India',
    category: 'agriculture',
    benefitType: 'loan',
    tags: ['All India', 'Loan'],
    description: 'Affordable credit access to farmers.',
    launchDate: '1998',
    officialUrl: 'https://agricoop.gov.in',
    isBookmarked: false,
  },
];

describe('Schemes Module Unit Tests', () => {
  it('filters schemes by keyword search', () => {
    const bookmarked = new Set<string>();
    const results = filterSchemesList(
      SAMPLE_SCHEMES,
      {
        query: 'farmer',
        category: 'all',
        benefitType: 'all',
        jurisdiction: 'All India',
        sort: 'relevant',
      },
      bookmarked
    );

    assert.ok(results.length > 0, 'Should return results for "farmer"');
    assert.ok(
      results.some((r) => r.title.includes('Kisan')),
      'Should include Kisan schemes'
    );
  });

  it('filters schemes by category', () => {
    const bookmarked = new Set<string>();
    const results = filterSchemesList(
      SAMPLE_SCHEMES,
      {
        query: '',
        category: 'women',
        benefitType: 'all',
        jurisdiction: 'All India',
        sort: 'relevant',
      },
      bookmarked
    );

    assert.strictEqual(results.length, 1, 'Should find exactly 1 women scheme');
    assert.ok(
      results.every((r) => r.category === 'women'),
      'All returned schemes should belong to women category'
    );
  });

  it('filters schemes by benefit type', () => {
    const bookmarked = new Set<string>();
    const loanResults = filterSchemesList(
      SAMPLE_SCHEMES,
      {
        query: '',
        category: 'all',
        benefitType: 'loan',
        jurisdiction: 'All India',
        sort: 'relevant',
      },
      bookmarked
    );

    assert.strictEqual(loanResults.length, 1, 'Should find 1 loan scheme');
    assert.ok(
      loanResults.every((r) => r.benefitType === 'loan'),
      'All returned schemes should have loan benefit type'
    );
  });

  it('retrieves saved/bookmarked schemes accurately', () => {
    const store = useSchemesStore.getState();
    store.syncServerSchemes(SAMPLE_SCHEMES);

    store.toggleBookmark('pm-kisan', 'PM Kisan');
    const saved = useSchemesStore.getState().getSavedSchemes();

    assert.ok(saved.length >= 1);
    assert.ok(saved.some((s) => s.id === 'pm-kisan' && s.isBookmarked));
  });

  it('Zustand store manages filters and bookmark toggling', () => {
    const store = useSchemesStore.getState();

    // Toggle bookmark on/off
    store.toggleBookmark('kcc', 'Kisan Credit Card (KCC)');
    assert.ok(
      useSchemesStore.getState().bookmarkedIds.has('kcc'),
      'Should add bookmark'
    );
    assert.strictEqual(
      useSchemesStore.getState().isSaveModalVisible,
      true,
      'Should show saved modal'
    );

    useSchemesStore.getState().closeSaveModal();
    assert.strictEqual(
      useSchemesStore.getState().isSaveModalVisible,
      false,
      'Should hide saved modal'
    );

    // Toggle off
    store.toggleBookmark('kcc');
    assert.ok(
      !useSchemesStore.getState().bookmarkedIds.has('kcc'),
      'Should remove bookmark'
    );
  });

  it('returns empty array when query has no matching schemes', () => {
    const bookmarked = new Set<string>();
    const results = filterSchemesList(
      SAMPLE_SCHEMES,
      {
        query: 'non-existent-xyz-query',
        category: 'all',
        benefitType: 'all',
        jurisdiction: 'All India',
        sort: 'relevant',
      },
      bookmarked
    );

    assert.strictEqual(results.length, 0, 'No schemes should match non-existent query');
  });

  it('syncs saved schemes with cloud database seamlessly', async () => {
    const { schemesApi } = await import('../repositories/schemes.api');
    await schemesApi.saveScheme('pm-kisan');
    const local = await schemesApi.getSavedSchemes();
    assert.ok(local.ok);
    assert.ok(local.data.some((s) => s.id === 'pm-kisan'));

    await schemesApi.removeSavedScheme('pm-kisan');
    const afterRemove = await schemesApi.getSavedSchemes();
    assert.ok(afterRemove.ok);
    assert.ok(!afterRemove.data.some((s) => s.id === 'pm-kisan'));
  });
});
