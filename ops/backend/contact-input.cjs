'use strict';
function contactInput(value, messageLimit=10000) {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const field=(key,alias)=>typeof value[key]==='string'?value[key].trim():alias&&typeof value[alias]==='string'?value[alias].trim():'';
 const sender_name=field('sender_name','name'),sender_email=field('sender_email','email'),subject=field('subject')||'Website enquiry';
 const message=field('message'),company=field('company'),plan=field('plan');
 if(!sender_name||sender_name.length>150||sender_email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sender_email)||subject.length>200||!message||message.length>messageLimit||company.length>200||plan.length>50||/[\r\n]/.test(sender_name+sender_email+subject+company+plan))return null;
 const combined=[company&&'Company: '+company,plan&&'Selected plan: '+plan,message].filter(Boolean).join('\n\n');
 return combined.length>10500?null:{sender_name,sender_email,subject,message:combined};
}
module.exports={contactInput};
