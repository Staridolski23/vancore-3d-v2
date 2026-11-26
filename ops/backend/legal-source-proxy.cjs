'use strict';
const {execFile}=require('node:child_process');
const {createHash}=require('node:crypto');
const {join}=require('node:path');
const SOURCES=Object.freeze({
 'bg-obligations':'https://justice.government.bg/home/normdoc/2121934337',
 'bg-commerce':'https://justice.government.bg/home/normdoc/-14917630',
 'bg-labour':'https://justice.government.bg/home/normdoc/1594373121',
 'eu-gdpr':'https://eur-lex.europa.eu/eli/reg/2016/679/'
});
// Public Publications Office download linked by its GDPR publication detail page.
// Preserve the canonical EUR-Lex citation separately from the actual transport URL.
const DOWNLOADS=Object.freeze({...SOURCES,'eu-gdpr':'https://op.europa.eu/o/opportal-service/download-handler?identifier=3e485e15-11bd-11e6-ba9a-01aa75ed71a1&format=xhtml&language=en&productionSystem=cellar&part='});
function downloadOfficial(url){
 const trust=url.startsWith('https://justice.government.bg/')?['--cacert',join(__dirname,'legal-source-ca.pem'),'--capath','/etc/ssl/certs']:[];
 return new Promise((resolve,reject)=>execFile('/usr/bin/curl',['--fail','--silent','--show-error','--proto','=https',...trust,'--connect-timeout','3','--max-time','8','--max-filesize','2500000','--user-agent','VANCORE-Legal-Research/1.0','--write-out','\nVANCORE_STATUS:%{http_code}',url],{encoding:'utf8',timeout:8500,maxBuffer:2600000,windowsHide:true},(error,stdout)=>{
  const suffix='\nVANCORE_STATUS:200';
  if(error||!stdout.endsWith(suffix))return reject(Error('Official source unavailable'));
  resolve(stdout.slice(0,-suffix.length));
 }));
}
function createSourceService({download=downloadOfficial,clock=Date.now}={}){
 const pending=new Map();
 return {async read(id){
  if(!Object.hasOwn(SOURCES,id))return{status:404,body:{error:'Source not supported'}};
  if(pending.has(id))return pending.get(id);
  if(pending.size>=3)return{status:503,body:{error:'Source service busy'}};
  const task=(async()=>{try{
   const html=await download(DOWNLOADS[id]);
   if(typeof html!=='string'||Buffer.byteLength(html)<1000||Buffer.byteLength(html)>2500000||!/^\s*(?:<\?xml\s[^?]*\?>\s*)?(?:<!doctype\s+html|<html\b)/i.test(html)||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(html))throw Error('Invalid source document');
   const body={sourceId:id,url:SOURCES[id],transportUrl:DOWNLOADS[id],html,sha256:createHash('sha256').update(html).digest('hex'),downloadedAt:new Date(clock()).toISOString()};
   if(Buffer.byteLength(JSON.stringify(body))>4000000)throw Error('Oversized source response');
   return{status:200,body};
  }catch{return{status:502,body:{error:'Official source unavailable'}};}})();
  pending.set(id,task);try{return await task;}finally{pending.delete(id);}
 }};
}
function installLegalSources(app,{principal,express,download,clock=Date.now}={}){
 if(typeof principal!=='function')throw Error('Canonical identity verifier required');
 const router=(express||require('express')).Router(),service=createSourceService({download,clock}),limits=new Map();
 router.use(async(req,res,next)=>{
  res.set('Cache-Control','private, no-store');res.set('X-Content-Type-Options','nosniff');res.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
  let user;try{user=await principal(req);}catch{return res.status(503).json({error:'Unable to verify access'});}
  if(req.vancoreAuthUnavailable)return res.status(503).json({error:'Unable to verify access'});
  if(!user?.id)return res.status(401).json({error:'Unauthorized'});
  const now=clock();for(const [id,item]of limits)if(item.until<=now)limits.delete(id);
  if(!limits.has(user.id)&&limits.size>=1000)return res.status(503).json({error:'Source service busy'});
  const rate=limits.get(user.id)||{count:0,until:now+60000};
  if(rate.count>=4){res.set('Retry-After',String(Math.max(1,Math.ceil((rate.until-now)/1000))));return res.status(429).json({error:'Source request limit reached'});}
  rate.count++;limits.set(user.id,rate);next();
 });
 router.get('/:sourceId',async(req,res)=>{const result=await service.read(req.params.sourceId);res.status(result.status).json(result.body);});
 router.use((_req,res)=>res.status(404).json({error:'Source route not found'}));
 app.use('/api/legal-sources',router);
}
module.exports={SOURCES,createSourceService,installLegalSources};
