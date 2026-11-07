const {test}=require('node:test'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {bookingCalendar,bookingStartUtc}=require('../ops/backend/booking-calendar.cjs');

test('calendar uses the agreed 45-minute Sofia interval in winter, summer and DST transitions',()=>{
 for(const [date,start] of [['2026-01-15','07:00'],['2026-07-15','06:00'],['2026-03-29','06:00'],['2026-10-25','07:00']]){
  assert.equal(bookingStartUtc(date,'09:00').toISOString(),date+'T'+start+':00.000Z');
  const ics=bookingCalendar({id:17,date,time:'09:00',status:'confirmed'},new Date('2026-11-07T00:00:00Z'));
  const fields=Object.fromEntries(ics.split('\r\n').filter(line=>line.includes(':')).map(line=>{const at=line.indexOf(':');return[line.slice(0,at),line.slice(at+1)];}));
  const instant=value=>Date.parse(value.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,'$1-$2-$3T$4:$5:$6Z'));
  assert.equal(instant(fields.DTEND)-instant(fields.DTSTART),45*60000);
  assert.equal(fields.UID,'vancore-booking-17@vancoresys.com');assert.equal(fields.DTSTAMP,'20261107T000000Z');
  assert.ok(ics.endsWith('\r\n'));assert.ok(!/(?<!\r)\n/.test(ics));assert.ok(ics.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
 }
 for(const [date,time] of [['2026-02-30','09:00'],['2026-03-29','03:30'],['2026-10-25','03:30'],['2026-01-15','24:00']])assert.throws(()=>bookingStartUtc(date,time));
});

test('calendar output is independent of visitor timezone, has stable UID and excludes hostile/private fields',()=>{
 const script="process.stdout.write(require('./ops/backend/booking-calendar.cjs').bookingCalendar({id:17,date:'2026-07-15',time:'09:00',status:'confirmed'},new Date('2026-11-07T00:00:00Z')))";
 const render=tz=>execFileSync(process.execPath,['-e',script],{cwd:require('node:path').resolve(__dirname,'..'),env:{...process.env,TZ:tz},encoding:'utf8'});
 assert.equal(render('America/Los_Angeles'),render('Australia/Sydney'));
 const booking={id:17,date:'2026-07-15',time:'09:00',status:'rescheduled',email:'private@example.invalid',description:'\r\nATTENDEE:unexpected@example.invalid'};
 const ics=bookingCalendar(booking);assert.ok(!ics.includes('private'));assert.ok(!ics.includes('ATTENDEE'));
 assert.equal(ics.match(/^UID:.+$/m)[0].trim(),render('UTC').match(/^UID:.+$/m)[0].trim());
 for(const bad of [{...booking,id:'17\r\nATTENDEE:x'},{...booking,status:'cancelled'},{...booking,status:'new'}])assert.throws(()=>bookingCalendar(bad));
});
