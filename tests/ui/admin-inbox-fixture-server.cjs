'use strict';
// Local UI fixture only. Every /api request is intercepted here; none reaches
// the actual Next API, Supabase, DigitalOcean, SMTP or a third-party provider.
const http=require('node:http');
let mode='populated',requests=[],profileKind='admin',bookingMode='success',releaseBooking=null;
const initialBookings=()=>[{id:17,name:'Synthetic Client',email:'qa@example.invalid',date:'2026-12-15',time:'09:00',status:'new'},{id:18,name:'Synthetic Client',email:'qa@example.invalid',date:'2026-12-15',time:'09:45',status:'confirmed'}];
let bookings=initialBookings(),bookingWrites=[];
const fixtureToken='synthetic-admin-ui-fixture-token';
const messages=[{id:'fixture-enquiry',sender_name:'Synthetic Client <b>literal</b>',sender_email:'qa@example.invalid',type:'contact',subject:'Professional plan enquiry',message:'Selected plan: professional\n\nSynthetic saved enquiry. No real email was sent.',created_at:'2026-11-07T00:00:00Z',notification_status:'queued'}];
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:3107');
 const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(url.pathname==='/__qa__/portal'&&req.method==='POST'){
  let raw='';for await(const part of req)raw+=part;const input=JSON.parse(raw);
  if(!['admin','client'].includes(input.profile)||!['success','reject','network','malformed','refresh-failure','hold'].includes(input.bookingMode))return json({error:'Invalid portal fixture'},400);
  profileKind=input.profile;bookingMode=input.bookingMode;if(input.reset){bookings=initialBookings();bookingWrites=[];}
  return json({profileKind,bookingMode});
 }
 if(url.pathname==='/__qa__/release'&&req.method==='POST'){if(releaseBooking){releaseBooking();releaseBooking=null;}return json({released:true});}
 if(url.pathname==='/__qa__/mode'&&req.method==='POST'){
  let body='';for await(const part of req)body+=part;
  const next=JSON.parse(body).mode;if(!['populated','empty','failure','forbidden'].includes(next))return json({error:'Unknown fixture mode'},400);
  mode=next;return json({mode});
 }
 if(url.pathname==='/__qa__/state')return json({mode,requests,profileKind,bookingMode,bookingWrites,bookings,realEmailsSent:0,realCloudWrites:0});
 if(url.pathname.startsWith('/api/')){
  requests.push({method:req.method,path:url.pathname});
  if(url.pathname==='/api/content')return json({sections:{},order:[]});
  if(url.pathname==='/api/auth'){
   let raw='';for await(const part of req)raw+=part;
   const body=JSON.parse(raw);
   if(body.action!=='login')return json({error:'Unexpected fixture auth action'},400);
   return json({token:fixtureToken,user:{id:'fixture-admin',role:'admin'},redirectTo:'/admin-v2'});
  }
  if(url.pathname==='/api/auth/session')return json(req.method==='DELETE'?{success:true}:{token:fixtureToken});
  // The existing admin page still uses a fixed email allowlist. This local-only
  // response exercises that gate without signing into or contacting any account.
  if(url.pathname==='/api/auth/profile')return json({user:profileKind==='admin'?{id:'fixture-admin',name:'Synthetic Admin (local fixture)',email:'zhanet@vancore.ai',role:'admin',plan:'starter',credits:0}:{id:'fixture-client',name:'Synthetic Client (local fixture)',email:'qa@example.invalid',role:'client',plan:'starter',credits:5}});
  if(url.pathname==='/api/adminv2')return json({totalClients:0,activeSubscriptions:0,verifiedEmails:0});
  if(url.pathname==='/api/adminv2/clients')return json({clients:[]});
  if(url.pathname==='/api/adminv2/content')return json({content:[]});
  if(url.pathname==='/api/adminv2/settings')return json({settings:{}});
  if(url.pathname==='/api/bookings')return profileKind==='client'&&bookingMode==='refresh-failure'&&bookingWrites.length?json({error:'Synthetic list outage'},503):json({bookings:profileKind==='client'?bookings:[]});
  if(url.pathname==='/api/documents')return json({documents:[]});
  if(url.pathname==='/api/chat')return json({messages:[]});
  if(/^\/api\/bookings\/\d+(\/propose)?$/.test(url.pathname)&&['PUT','POST'].includes(req.method)){
   let raw='';for await(const part of req)raw+=part;const body=JSON.parse(raw);bookingWrites.push({path:url.pathname,body});
   if(bookingMode==='hold')await new Promise(resolve=>{releaseBooking=resolve;});
   if(bookingMode==='network'){req.socket.destroy();return;}
   if(bookingMode==='reject')return json({error:'Synthetic booking conflict'},409);
   if(bookingMode==='malformed')return json({unexpected:true});
   if(!url.pathname.endsWith('/propose'))bookings=bookings.map(booking=>booking.id===Number(url.pathname.split('/')[3])?{...booking,status:body.status,confirmed_at:'2026-11-07T00:00:00Z'}:booking);
   return json({success:true,id:701});
  }
  if(url.pathname==='/api/reviews')return json({reviews:[]});
  if(url.pathname==='/api/adminv2/incoming'){
   if(req.headers.authorization!=='Bearer '+fixtureToken)return json({error:'Missing synthetic identity'},401);
   if(mode==='failure')return json({error:'Synthetic service outage'},503);
   if(mode==='forbidden')return json({error:'Synthetic access denial'},403);
   return json({messages:mode==='empty'?[]:messages});
  }
  return json({error:'Unexpected QA API request'},418);
 }
 const upstream=http.request({hostname:'127.0.0.1',port:3106,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:3106'}},incoming=>{res.writeHead(incoming.statusCode,incoming.headers);incoming.pipe(res);});
 upstream.on('error',()=>json({error:'Local fixture upstream unavailable'},502));req.pipe(upstream);
});
server.listen(3107,'127.0.0.1',()=>console.log('Isolated admin UI fixture: http://127.0.0.1:3107/login'));
