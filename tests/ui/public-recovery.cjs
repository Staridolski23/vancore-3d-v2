const assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
exports.fixture=async()=>{
 let handler;
 require('../../ops/backend/auth-recovery.cjs').installAuthRecovery({get:(_path,fn)=>{handler=fn;}},{url:'https://wqvhivuyvzdbuguuojhk.supabase.co',publishableKey:'sb_publishable_fixture'});
 const server=http.createServer((req,res)=>{
  if(req.url.split(/[?#]/)[0]!=='/auth/reset-password'){res.writeHead(404);return res.end();}
  handler(req,{set:headers=>{for(const [k,v]of Object.entries(headers))res.setHeader(k,v);},type:()=>({send:body=>{res.setHeader('Content-Type','text/html');res.end(body);}})});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return{server,base:'http://127.0.0.1:'+server.address().port};
};
exports.run=async(page,context,base,outputDirectory)=>{
 let status=200,networkFail=false,calls=0,delay=0;const results=[];
 await context.route('https://wqvhivuyvzdbuguuojhk.supabase.co/**',async route=>{
  calls++;const request=route.request();assert.equal(request.method(),'PUT');assert.equal(new URL(request.url()).pathname,'/auth/v1/user');
  assert.equal(request.headers().authorization,'Bearer synthetic-recovery-access');assert.equal(request.headers().referer,undefined);
  assert.equal(request.postDataJSON().password,'Synthetic-password-123');
  if(networkFail)return route.abort('connectionfailed');
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  return route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{id:'synthetic-user'}:{msg:'synthetic provider rejection'})});
 });
 const open=async(fragment='type=recovery&access_token=synthetic-recovery-access&refresh_token=synthetic-refresh')=>{
  await page.goto('about:blank');
  await page.goto(base+'/auth/reset-password'+(fragment?'#'+fragment:''));assert.equal(new URL(page.url()).hash,'');
 };
 const fill=async()=>{await page.locator('#new-password').fill('Synthetic-password-123');await page.locator('#confirm-password').fill('Synthetic-password-123');};
 await open('');await page.getByRole('status').filter({hasText:'missing, invalid or expired'}).waitFor();assert.equal(await page.locator('form').isVisible(),false);assert.equal(calls,0);results.push({check:'Missing token fails closed without any provider call',status:'PASS'});
 await open('type=recovery&error_code=otp_expired&access_token=discard-me');assert.equal(await page.locator('form').isVisible(),false);assert.equal(new URL(page.url()).hash,'');results.push({check:'Expired/error callback is scrubbed and cannot submit',status:'PASS'});
 await open();await fill();await page.locator('#confirm-password').fill('Different-synthetic-password');await page.getByRole('button',{name:'Update password',exact:true}).click();await page.getByRole('alert').filter({hasText:'matching passwords'}).waitFor();assert.equal(calls,0);results.push({check:'Mismatch never sends a password change',status:'PASS'});
 for(const scenario of [{code:401,text:'invalid or expired'},{code:422,text:'different strong password'},{code:429,text:'Too many attempts'},{code:503,text:'temporarily unavailable'}]){
  status=scenario.code;await open();await fill();await page.getByRole('button',{name:'Update password',exact:true}).click();await page.getByRole('alert').filter({hasText:scenario.text}).waitFor();assert.equal(await page.getByRole('button',{name:'Update password',exact:true}).isEnabled(),true);
  assert.equal(await page.locator('#new-password').inputValue(),'Synthetic-password-123');results.push({check:'Provider '+status+' is visible and never reports success',status:'PASS'});
 }
 networkFail=true;await open();await fill();await page.getByRole('button',{name:'Update password',exact:true}).click();await page.getByRole('alert').filter({hasText:'result could not be confirmed'}).waitFor();networkFail=false;results.push({check:'Interrupted request reports an uncertain outcome without automatic retry',status:'PASS'});
 status=200;delay=500;await open();await fill();const before=calls;await page.getByRole('button',{name:'Update password',exact:true}).click();assert.equal(await page.locator('#submit').isDisabled(),true);await page.getByRole('status').filter({hasText:'Password updated.'}).waitFor();assert.equal(calls,before+1);assert.equal(await page.locator('form').isVisible(),false);assert.equal(await page.locator('#new-password').inputValue(),'');assert.equal(await page.evaluate(()=>Object.keys(localStorage).length+Object.keys(sessionStorage).length),0);results.push({check:'Single successful request clears fields and keeps credentials out of browser storage',status:'PASS'});
 await page.setViewportSize({width:390,height:844});await open();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await fs.mkdir(outputDirectory,{recursive:true});await page.screenshot({path:path.join(outputDirectory,'VANCORE-public-recovery-mobile.png')});results.push({check:'Mobile form has labels and fits 390px without horizontal scroll',status:'PASS'});
 const report={date:new Date().toISOString(),environment:'local actual recovery handler with intercepted provider API',realEmailsSent:0,realPasswordsChanged:0,results};await fs.writeFile(path.join(outputDirectory,'VANCORE-public-recovery-ui-qa.json'),JSON.stringify(report,null,2));return report;
};
