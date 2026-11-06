'use strict';
// Read-only connection/authentication check. Never sends a message or logs secrets.
const {createRequire}=require('node:module');
const fs=require('node:fs');
const load=createRequire('/home/vancore/vancore-backend/package.json');
const env=load('dotenv').parse(fs.readFileSync('/home/vancore/vancore-backend/.env'));
const host=env.ZOHO_SMTP_HOST||'smtp.zoho.com';
const port=Number(env.ZOHO_SMTP_PORT||587);
if(!['smtp.zoho.com','smtp.zoho.eu','smtppro.zoho.com','smtppro.zoho.eu'].includes(host)||![465,587].includes(port))throw Error('Unreviewed SMTP destination');
if(!env.ZOHO_EMAIL||!env.ZOHO_PASSWORD){console.log(JSON.stringify({configured:false,messagesSent:0}));process.exit(0);}
const smtp=load('nodemailer').createTransport({host,port,secure:port===465,requireTLS:port===587,auth:{user:env.ZOHO_EMAIL,pass:env.ZOHO_PASSWORD},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000});
smtp.verify().then(()=>{console.log(JSON.stringify({configured:true,verified:true,host,port,sender:env.ZOHO_EMAIL,messagesSent:0}));smtp.close();}).catch(error=>{console.log(JSON.stringify({configured:true,verified:false,host,port,sender:env.ZOHO_EMAIL,code:error.code,responseCode:error.responseCode,messagesSent:0}));smtp.close();process.exitCode=1;});
