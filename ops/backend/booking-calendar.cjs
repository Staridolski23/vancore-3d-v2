'use strict';
const {validDate,validTime,companyClock,DURATION_MINUTES}=require('./booking-policy.cjs');

// Resolve a company wall clock to an instant, independent of the visitor's TZ.
// Check both sides of a DST boundary; reject nonexistent or ambiguous times.
function bookingStartUtc(date,time) {
 if(!validDate(date)||!validTime(time))throw Error('Invalid appointment date or time');
 const wall=Date.parse(date+'T'+time+':00Z');
 const offsets=new Set([-86400000,0,86400000].map(delta=>{
  const instant=new Date(wall+delta),local=companyClock(instant);
  return Date.parse(local.date+'T00:00:00Z')+local.minutes*60000-instant.getTime();
 }));
 const candidates=[...offsets].map(offset=>new Date(wall-offset)).filter(instant=>{
  const local=companyClock(instant);return local.date===date&&local.minutes===Number(time.slice(0,2))*60+Number(time.slice(3,5));
 });
 if(candidates.length!==1)throw Error('Appointment time needs team review');
 return candidates[0];
}

function bookingCalendar(booking,now=new Date()) {
 const id=String(booking?.id??'');
 if(!/^(?:[1-9][0-9]{0,15}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(id)||!['confirmed','rescheduled'].includes(booking?.status))throw Error('Only an agreed appointment can be exported');
 const start=bookingStartUtc(booking.date,booking.time),end=new Date(start.getTime()+DURATION_MINUTES*60000);
 const stamp=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 // Only validated identifiers and static text enter the file; no client contact
 // data or unescaped user text. All lines are below the RFC 5545 octet limit.
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//VANCORE//Client Portal//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',
  'UID:vancore-booking-'+id.toLowerCase()+'@vancoresys.com','DTSTAMP:'+stamp(now),
  'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'SUMMARY:VANCORE Consultation',
  'DESCRIPTION:Booked consultation via vancoresys.com','STATUS:CONFIRMED','END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
module.exports={bookingStartUtc,bookingCalendar};
