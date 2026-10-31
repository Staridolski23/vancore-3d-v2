const {test}=require('node:test'),assert=require('node:assert/strict');
const {overlaps,blockedStartTimes,companyClock}=require('../ops/backend/booking-policy.cjs');
test('45-minute booking boundaries reject partial overlaps and allow adjacent intervals',()=>{
 assert.equal(overlaps('09:00','09:30'),true);assert.equal(overlaps('09:30','09:00'),true);
 assert.equal(overlaps('09:00','09:45'),false);assert.equal(overlaps('09:45','09:00'),false);
 assert.deepEqual(blockedStartTimes('09:30'),['09:00','09:30','10:00']);
 assert.deepEqual(blockedStartTimes('invalid'),[]);
});
test('Sofia calendar clock is independent of visitor timezone and follows both DST transitions',()=>{
 assert.deepEqual(companyClock(new Date('2026-03-29T00:30:00Z')),{date:'2026-03-29',minutes:150});
 assert.deepEqual(companyClock(new Date('2026-03-29T01:30:00Z')),{date:'2026-03-29',minutes:270});
 assert.deepEqual(companyClock(new Date('2026-10-25T00:30:00Z')),{date:'2026-10-25',minutes:210});
 assert.deepEqual(companyClock(new Date('2026-10-25T01:30:00Z')),{date:'2026-10-25',minutes:210});
 assert.deepEqual(companyClock(new Date('2026-12-31T22:30:00Z')),{date:'2027-01-01',minutes:30});
});
