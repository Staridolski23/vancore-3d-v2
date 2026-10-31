'use strict';
// Shared by the calendar, Next proxy and SQLite guards. No credentials/runtime IO.
const DURATION_MINUTES=45;
const TIME_ZONE='Europe/Sofia';
const WORK_HOURS=Array.from({length:17},(_,i)=>`${String(9+Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`);
/** @param {unknown} value */
function validDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===value;}
/** @param {unknown} value */
function validTime(value){return typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);}
/** @param {string} value */
function minutes(value){return Number(value.slice(0,2))*60+Number(value.slice(3,5));}
/** @param {string} a @param {string} b */
function overlaps(a,b){return minutes(a)<minutes(b)+DURATION_MINUTES&&minutes(b)<minutes(a)+DURATION_MINUTES;}
/** @param {string} start */
function blockedStartTimes(start){return validTime(start)?WORK_HOURS.filter(slot=>overlaps(slot,start)):[];}
/** @param {Date} [now] */
function companyClock(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=name=>parts.find(part=>part.type===name)?.value||'';
 return {date:`${get('year')}-${get('month')}-${get('day')}`,minutes:Number(get('hour'))*60+Number(get('minute'))};
}
const asMinutes=alias=>`(CAST(substr(${alias}.time,1,2) AS INTEGER)*60+CAST(substr(${alias}.time,4,2) AS INTEGER))`;
const bookingOverlapGuards=['INSERT','UPDATE OF date,time,status'].map((event,index)=>`
CREATE TRIGGER IF NOT EXISTS vancore_booking_interval_${index===0?'insert':'update'}
BEFORE ${event} ON bookings
WHEN NEW.status IS NULL OR NEW.status!='cancelled'
BEGIN
 SELECT RAISE(ABORT,'VANCORE_BOOKING_OVERLAP') WHERE EXISTS(
  SELECT 1 FROM bookings b WHERE b.id!=coalesce(NEW.id,-1) AND b.date=NEW.date
   AND coalesce(b.status,'new')!='cancelled'
   AND ${asMinutes('b')}<${asMinutes('NEW')}+${DURATION_MINUTES}
   AND ${asMinutes('NEW')}<${asMinutes('b')}+${DURATION_MINUTES}
 );
END;`).join('\n');
module.exports={DURATION_MINUTES,TIME_ZONE,WORK_HOURS,validDate,validTime,minutes,overlaps,blockedStartTimes,companyClock,bookingOverlapGuards};
