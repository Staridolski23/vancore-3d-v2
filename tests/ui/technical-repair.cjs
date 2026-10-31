const assert=require('node:assert/strict');
const fs=require('node:fs/promises');const path=require('node:path');
// Invoke run(page, context, outputDirectory) from the persistent Playwright QA
// session. This suite is confined to localhost and uses synthetic API fixtures.
exports.run=async function(page,context,outputDirectory){
 const results=[],base='http://127.0.0.1:3100';let contactFail=false,recoveryCalls=0,profileCalls=0,refreshCalls=0,transient=false;
 const fresh='fresh-synthetic-token-for-qa-only',expired='expired-synthetic-token-for-qa-only';
 await context.unroute('**/*');
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname!=='127.0.0.1')return route.abort();
  if(!url.pathname.startsWith('/api/'))return route.continue();
  const reply=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(url.pathname==='/api/contact')return reply(contactFail?{error:'Synthetic outage'}:{success:true},contactFail?502:200);
  if(url.pathname==='/api/auth/session'){
   assert.equal(request.headers()['x-vancore-session'],'1');
   if(request.method()==='DELETE')return reply({success:true});
   refreshCalls++;return reply({token:fresh});
  }
  if(url.pathname==='/api/auth/profile'){
   profileCalls++;
   if(transient)return reply({error:'Synthetic provider outage'},503);
   if(request.headers().authorization!=='Bearer '+fresh)return reply({error:'Expired'},401);
   return reply({user:{id:'00000000-0000-4000-8000-000000000001',email:'qa@example.invalid',name:'QA Client',company:'Synthetic Company',phone:'',vat_id:'',role:'client',plan:'starter',credits:0,subscription_status:'free'}});
  }
  if(url.pathname==='/api/auth'){
   const body=request.postDataJSON();
   if(body.action==='recover-password'){recoveryCalls++;return reply({error:'Invalid synthetic recovery link'},401);}
   return reply({success:true});
  }
  if(url.pathname==='/api/content')return reply({sections:{},order:[]});
  if(url.pathname==='/api/bookings')return reply({bookings:[]});
  if(url.pathname==='/api/documents')return reply({documents:[]});
  if(url.pathname==='/api/reviews')return reply({reviews:[]});
  if(url.pathname==='/api/chat')return reply({messages:[]});
  return reply({error:'Unexpected fixture API'},404);
 });
 await page.goto(base+'/contact');
 const reject=page.getByRole('button',{name:'Reject Non-Essential',exact:true});
 if(await reject.isVisible().catch(()=>false))await reject.click();
 else {await page.waitForTimeout(600);if(await reject.isVisible())await reject.click();}
 await page.locator('#name').fill('QA Client');await page.locator('#email').fill('qa@example.invalid');
 await page.locator('#company').fill('Synthetic Company');await page.locator('#message').fill('Synthetic form fixture. No email is sent.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByText('✓ Message sent!',{exact:true}).waitFor();results.push({check:'Contact form success state',status:'PASS',fixture:'mock API; no email'});
 await page.goto(base+'/');contactFail=true;
 await page.locator('#contact-name').fill('QA Client');await page.locator('#contact-email').fill('qa@example.invalid');
 await page.locator('#contact-subject').fill('Fixture');await page.locator('#contact-message').fill('Preserve this synthetic draft');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByText('Your enquiry could not be recorded. Please try again.',{exact:true}).waitFor();assert.equal(await page.locator('#contact-message').inputValue(),'Preserve this synthetic draft');
 results.push({check:'Home contact error visible and draft preserved',status:'PASS',fixture:'mock 502'});
 await page.goto(base+'/login#type=recovery&access_token=synthetic-access&refresh_token=synthetic-refresh');
 await page.getByRole('heading',{name:'Set a new password',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');
 await page.locator('#recovery-password').fill('synthetic-password-one');await page.locator('#recovery-confirm').fill('synthetic-password-two');
 await page.getByRole('button',{name:'Update password',exact:true}).click();await page.getByText('Enter matching passwords of 8–128 characters.',{exact:true}).waitFor();assert.equal(recoveryCalls,0);
 await page.locator('#recovery-confirm').fill('synthetic-password-one');await page.getByRole('button',{name:'Update password',exact:true}).click();
 await page.getByText('Your password could not be reset. Check the link and password requirements, or request a new link.',{exact:true}).waitFor();assert.equal(recoveryCalls,1);
 results.push({check:'Recovery credentials removed from URL; mismatch and invalid link handled',status:'PASS',fixture:'mock recovery; no password changed'});
 await page.evaluate(token=>localStorage.setItem('vancore_client_token',token),expired);
 await page.goto(base+'/client-portal');await page.getByRole('heading',{name:/Welcome, QA Client/}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('vancore_client_token')),fresh);assert.ok(refreshCalls>=1);
 results.push({check:'Expired client access token renews and portal loads',status:'PASS',fixture:'mock identity and refresh; zero credits preserved'});
 await page.goto(base+'/admin-v2');await page.waitForURL(base+'/client-portal');assert.equal(await page.evaluate(()=>localStorage.getItem('vancore_client_token')),fresh);
 results.push({check:'Client admin denial preserves valid session',status:'PASS',fixture:'mock client identity'});
 transient=true;await page.goto(base+'/admin-v2');await page.getByRole('alert').filter({hasText:'The sign-in service is temporarily unavailable.'}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('vancore_client_token')),fresh);
 results.push({check:'Temporary auth outage does not delete client session',status:'PASS',fixture:'mock 503'});
 await fs.mkdir(outputDirectory,{recursive:true});await page.screenshot({path:path.join(outputDirectory,'VANCORE-auth-outage-qa.png')});
 const report={date:new Date().toISOString(),environment:'localhost with intercepted synthetic APIs',realEmailsSent:0,realPasswordsChanged:0,profileCalls,refreshCalls,results};
 await fs.writeFile(path.join(outputDirectory,'VANCORE-technical-ui-qa.json'),JSON.stringify(report,null,2));return report;
};
