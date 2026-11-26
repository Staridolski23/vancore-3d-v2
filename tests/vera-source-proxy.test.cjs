const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {loadVera}=require('./helpers/vera-module.cjs');
const {createSourceService,SOURCES,installLegalSources}=require('../ops/backend/legal-source-proxy.cjs');
const html='<!DOCTYPE html><html>'+('Synthetic public source. '.repeat(80))+'</html>';
test('source transport allows only fixed HTTPS official URLs, bounds bodies and never returns upstream errors',async()=>{
 let calls=[];const service=createSourceService({download:async url=>{calls.push(url);return html;},clock:()=>100000});
 assert.equal((await service.read('../../private')).status,404);assert.equal((await service.read('__proto__')).status,404);assert.equal(calls.length,0);
 const first=await service.read('bg-obligations');assert.equal(first.status,200);assert.equal(calls[0],SOURCES['bg-obligations']);assert.equal(first.body.sha256,createHash('sha256').update(html).digest('hex'));
 await service.read('bg-obligations');assert.equal(calls.length,2,'Completed source bodies must not silently be served as a fresh download');
 const failure=await createSourceService({download:async()=>{throw Error('private bearer or upstream body');}}).read('eu-gdpr');assert.equal(failure.status,502);assert.doesNotMatch(JSON.stringify(failure),/bearer|private/);
 assert.equal((await createSourceService({download:async()=>'<html>challenge</html>'}).read('eu-gdpr')).status,502);
});
test('canonical identity guard rejects anonymous callers before any source download',async()=>{
 const middleware=[];let handler,downloads=0;
 const router={use:fn=>middleware.push(fn),get:(_path,fn)=>{handler=fn;}};
 const app={use:(path)=>assert.equal(path,'/api/legal-sources')};
 installLegalSources(app,{principal:async req=>req.allowed?{id:'client'}:null,express:{Router:()=>router},download:async()=>{downloads++;return html;}});
 const response=()=>({headers:{},set(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(body){this.body=body;return this;}});
 let res=response(),next=0;await middleware[0]({allowed:false},res,()=>next++);assert.equal(res.code,401);assert.equal(downloads,0);assert.equal(next,0);
 for(let i=0;i<4;i++){res=response();await middleware[0]({allowed:true},res,()=>next++);}res=response();await middleware[0]({allowed:true},res,()=>next++);assert.equal(res.code,429);assert.ok(res.headers['Retry-After']);assert.equal(downloads,0);
 assert.throws(()=>installLegalSources(app,{}),/verifier required/);
});
test('frontend relay confines the bearer to VANCORE and checks source URL, hash and actual download age',async()=>{
 const {createSourceProxy}=loadVera('src/lib/vera-source-proxy.ts');let captured,calls=0;
 const source={id:'bg-obligations',url:SOURCES['bg-obligations']};let body={sourceId:source.id,url:source.url,html,sha256:createHash('sha256').update(html).digest('hex'),downloadedAt:new Date(100000).toISOString()};
 const relay=createSourceProxy('Bearer synthetic-private-token',{clock:()=>100000,fetcher:async(url,options)=>{calls++;captured={url,options};return Response.json(body);}});
 const result=await relay(source);assert.equal(result.html,html);assert.equal(captured.url,'https://api.vancoresys.com/api/legal-sources/bg-obligations');assert.equal(captured.options.headers.Authorization,'Bearer synthetic-private-token');assert.equal(captured.options.redirect,'error');assert.equal(captured.options.body,undefined);
 body={...body,url:'https://other.invalid'};await assert.rejects(relay(source),/metadata/);body={...body,url:source.url,downloadedAt:new Date(-1000000).toISOString()};await assert.rejects(relay(source),/metadata/);
 assert.equal(await relay({id:'unknown',url:'https://evil.invalid'}),null);assert.equal(await createSourceProxy(null)(source),null);
});
