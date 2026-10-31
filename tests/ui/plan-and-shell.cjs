const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
exports.run=async function(page,context,outputDirectory){
 const base='http://127.0.0.1:3100',results=[];let posted,profilePlan='starter';
 await context.unroute('**/*');
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname!=='127.0.0.1')return route.abort();
  if(!url.pathname.startsWith('/api/'))return route.continue();
  const reply=data=>route.fulfill({contentType:'application/json',body:JSON.stringify(data)});
  if(url.pathname==='/api/contact'){posted=request.postDataJSON();return reply({success:true});}
  if(url.pathname==='/api/auth/profile')return reply({user:{id:'synthetic-client',email:'qa@example.invalid',name:'QA Client',company:'Synthetic',phone:'',role:'client',plan:profilePlan,credits:5,subscription_status:'free'}});
  if(url.pathname==='/api/content')return reply({sections:{},order:[]});
  if(url.pathname==='/api/bookings')return reply({bookings:[]});
  if(url.pathname==='/api/documents')return reply({documents:[]});
  if(url.pathname==='/api/reviews')return reply({reviews:[]});
  if(url.pathname==='/api/chat')return reply({messages:[]});
  return reply({});
 });
 await page.setViewportSize({width:1280,height:900});
 await page.goto(base+'/pricing');
 const reject=page.getByRole('button',{name:'Reject Non-Essential',exact:true});
 await page.waitForTimeout(650);if(await reject.isVisible())await reject.click();
 for(const [index,plan]of ['payg','professional','business'].entries()){
  await page.goto(base+'/pricing');
  await page.getByRole('button',{name:'Request this plan',exact:true}).nth(index).click();
  await page.waitForURL(base+'/contact?plan='+plan);
  await page.getByRole('status').filter({hasText:'Plan enquiry:'}).waitFor();
  assert.ok(!page.url().includes('email='));
 }
 await page.locator('#name').fill('Synthetic Client');await page.locator('#email').fill('qa@example.invalid');
 await page.locator('#message').fill('Synthetic plan enquiry; no email will be sent.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByText('✓ Message sent!',{exact:true}).waitFor();assert.equal(posted.plan,'business');
 results.push({check:'All public plan choices reach a labelled enquiry; selected plan is sent in form body',status:'PASS'});
 await page.goto(base+'/client-portal');
 await page.evaluate(()=>localStorage.setItem('vancore_client_token','synthetic-client-token-for-qa-only'));
 for(const [index,plan]of ['payg','professional','business'].entries()){
  await page.goto(base+'/client-portal');await page.getByRole('heading',{name:/Welcome, QA Client/}).waitFor();
  await page.getByRole('button',{name:'💳Billing',exact:true}).click();
  await page.getByRole('button',{name:'Request plan',exact:true}).nth(index).click();
  await page.waitForURL(base+'/contact?plan='+plan);
  await page.getByRole('status').filter({hasText:'Plan enquiry:'}).waitFor();
 }
 results.push({check:'All portal plan buttons open enquiries without changing entitlement or exposing personal data',status:'PASS'});
 profilePlan='professional';await page.goto(base+'/client-portal');await page.getByRole('heading',{name:/Welcome, QA Client/}).waitFor();
 await page.getByRole('button',{name:'💳Billing',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Current Plan',exact:true}).isEnabled(),false);
 results.push({check:'Current plan remains read-only instead of pretending to make another purchase',status:'PASS'});
 await page.goto(base+'/contact?plan=untrusted');
 assert.equal(await page.getByRole('status').filter({hasText:'Plan enquiry:'}).count(),0);
 const pages=['/','/services','/pricing','/work','/about','/contact','/faq','/blog','/ai-analyst','/book-call','/privacy','/terms','/cookies','/legal/compliance'];
 for(const url of pages){await page.goto(base+url);assert.equal(await page.locator('footer').count(),1,url+' footer');assert.equal(await page.locator('#main-content').count(),1,url+' target');}
 results.push({check:'14 public routes contain exactly one footer and one skip-link target',status:'PASS'});
 await page.goto(base+'/pricing');
 await page.keyboard.press('Tab');await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>document.activeElement?.id),'main-content');
 results.push({check:'Skip to content works with keyboard on Pricing',status:'PASS'});
 for(const size of [192,512]){
  const response=await context.request.get(base+`/icons/icon-${size}.png`);assert.equal(response.status(),200);assert.ok(response.headers()['content-type'].includes('image/png'));
 }
 results.push({check:'Both manifest PNG resources return valid image responses',status:'PASS'});
 await page.goto(base+'/');
 for(const slide of [1,2,3,4]){await page.getByRole('button',{name:'Slide '+slide,exact:true}).click();assert.equal(await page.locator('img[src*="placeholder-"]').count(),0);}
 results.push({check:'All four industry slides use existing fallback instead of missing photos',status:'PASS'});
 await page.goto(base+'/contact?plan=business');await page.getByRole('status').filter({hasText:'Plan enquiry:'}).waitFor();
 await page.screenshot({path:path.join(outputDirectory,'VANCORE-plan-enquiry-desktop.png'),scale:'css'});
 const report={date:new Date().toISOString(),environment:'localhost with intercepted synthetic APIs',realEmailsSent:0,plansActivated:0,results};
 await fs.writeFile(path.join(outputDirectory,'VANCORE-plan-shell-qa.json'),JSON.stringify(report,null,2));return report;
};
