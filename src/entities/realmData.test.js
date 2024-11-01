import { expect, test, describe } from 'vitest';
import RealmData from './realmData.js';

describe('RealmData', async () => {
    let realmData;

    beforeEach(async () => {
        realmData = await RealmData.find('default');
    });

    describe('findClassByTitle', () => {
        test('finds correct class for valid title', () => {
            expect(realmData.findClassByTitle('Grunt')).toBe('Warrior');
            expect(realmData.findClassByTitle('Theurgist')).toBe('Mage');
        });

        test('returns undefined for invalid title', () => {
            expect(realmData.findClassByTitle('InvalidClass')).toBeUndefined();
        });

        test('is case sensitive', () => {
            expect(realmData.findClassByTitle('grunt')).toBeUndefined();
            expect(realmData.findClassByTitle('GRUNT')).toBeUndefined();
        });
    });

    describe('findLevelRangeByTitle', () => {
        test('finds correct level range for valid title', () => {
            expect(realmData.findLevelRangeByTitle('Grunt')).toEqual('5-9');
            expect(realmData.findLevelRangeByTitle('Clergywoman')).toEqual('5-9');
        });

        test('returns undefined for invalid title', () => {
            expect(realmData.findLevelRangeByTitle('InvalidTitle')).toBeUndefined();
        });

        test('is case sensitive', () => {
            expect(realmData.findLevelRangeByTitle('grunt')).toBeUndefined();
            expect(realmData.findLevelRangeByTitle('GRUNT')).toBeUndefined();
        });
    });

    describe('getAllTitles', () => {
        test('returns array of all titles', () => {
            const titles = realmData.getAllTitles();
            expect(Array.isArray(titles)).toBe(true);
            expect(titles.length).toBeGreaterThan(0);
            expect(titles).toContain('Cutthroat');
            expect(titles).toContain('Spellslinger');
        });

        test('returns unique titles', () => {
            const titles = realmData.getAllTitles();
            const uniqueTitles = [...new Set(titles)];
            expect(titles.length).toBe(uniqueTitles.length);
        });
    });
});
