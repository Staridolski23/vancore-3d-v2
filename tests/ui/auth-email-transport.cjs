const assert=require('node:assert/strict');const fs=require('node:fs/promises'),path=require('node:path');
exports.run=async(page,context,base,out)=>{
 let mode='success',calls=0;const results=[];
 await context.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url());if(u.hostname!=='127.0.0.1')return route.abort();
  if(!u.pathname.startsWith('/api/'))return route.continue();
  const json=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
  if(u.pathname==='/api/content')return json({sections:{},order:[]});
  if(u.pathname!=='/api/auth')return json({error:'Not signed in'},401);
  calls++;const body=r.postDataJSON();
  if(body.action==='login')return json({needsVerification:true,error:'Verify email'},403);
  if(mode==='html')return route.fulfill({status:401,contentType:'text/html',body:'<html>Protected deployment</html>'});
  if(mode==='protected')return json({error:{message:'Protected deployment'},protection:{vercel_auth_enabled:true}},401);
  if(mode==='network')return route.abort('connectionfailed');
  if(mode==='limit')return json({error:'Too many email attempts'},429);
  if(mode==='false-success')return json({success:false});
  return json({success:true});
 });
 const open=async()=>{await page.goto(base+'/login');const consent=page.getByRole('button',{name:'Reject Non-Essential',exact:true});if(await consent.isVisible())await consent.click();await page.getByRole('button',{name:'Forgot password?',exact:true}).click();await page.locator('#fp-email').fill('qa@example.invalid');};
 for(const scenario of [{mode:'html',text:'Access to this test version has expired.'},{mode:'protected',text:'Access to this test version has expired.'},{mode:'network',text:'The connection was interrupted'},{mode:'limit',text:'Too many email attempts'},{mode:'false-success',text:'Failed to send reset email.'}]){
  mode=scenario.mode;await open();await page.getByRole('button',{name:'Send Reset Link',exact:true}).click();await page.getByText(scenario.text,{exact:false}).waitFor();assert.equal(await page.locator('#fp-email').inputValue(),'qa@example.invalid');assert.equal(await page.getByRole('button',{name:'Send Reset Link',exact:true}).isEnabled(),true);assert.equal(await page.getByText('If an account exists for this email',{exact:false}).count(),0);results.push({check:mode+' keeps the email draft and gives an accurate error',status:'PASS'});
 }
 mode='success';await open();await page.getByRole('button',{name:'Send Reset Link',exact:true}).click();await page.getByText('If an account exists for this email',{exact:false}).waitFor();assert.equal(await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).isEnabled(),true);results.push({check:'Accepted request uses conditional copy and re-enables sign-in',status:'PASS'});
 mode='limit';await page.goto(base+'/login');await page.locator('#email').fill('qa@example.invalid');await page.locator('#password').fill('Synthetic-password-123');await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Resend Verification Email',exact:true}).click();await page.getByText('Too many email attempts',{exact:true}).waitFor();assert.equal(await page.getByText('If this account requires confirmation',{exact:false}).count(),0);results.push({check:'Verification resend provider errors never report email sent',status:'PASS'});
 await fs.writeFile(path.join(out,'VANCORE-auth-email-transport-qa.json'),JSON.stringify({date:new Date().toISOString(),environment:'localhost intercepted API fixtures',realEmailsSent:0,realPasswordsChanged:0,calls,results},null,2));return results;
};
