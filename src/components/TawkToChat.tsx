'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { authenticatedFetch } from '@/lib/authenticated-fetch';
import { CONSENT_CHANGED, CONSENT_KEY, readConsent } from '@/lib/cookie-consent';

type SupportApi={autoStart?:boolean;onLoad?:()=>void;start?:(options:{showWidget:boolean})=>void;shutdown?:()=>void;hideWidget?:()=>void};
declare global { interface Window { Tawk_API?:SupportApi;Tawk_LoadStart?:Date; } }
const SCRIPT_ID='vancore-support-chat';

export default function TawkToChat(){
  const pathname=usePathname();
  useEffect(()=>{
    let disposed=false,generation=0;
    const allowed=()=>{
      try{return readConsent(localStorage.getItem(CONSENT_KEY))?.support===true;}catch{return false;}
    };
    const stop=()=>{
      try{window.Tawk_API?.shutdown?.();}catch{}
      try{window.Tawk_API?.hideWidget?.();}catch{}
    };
    const sync=async()=>{
      const current=++generation;
      let token:string|null=null;
      try{token=localStorage.getItem('vancore_client_token');}catch{stop();return;}
      if(!allowed()||!token||/^\/(ai-analyst|admin|login|preview)(?:\/|-|$)/.test(pathname)){stop();return;}
      try{
        const response=await authenticatedFetch('/api/auth/profile');
        if(disposed||current!==generation)return;
        if(!response.ok){stop();return;}
        const data=await response.json();
        if(disposed||current!==generation)return;
        if(data.user?.role!=='client'||!allowed()){stop();return;}
        const api=window.Tawk_API||{};window.Tawk_API=api;
        api.autoStart=false;
        api.onLoad=()=>{
          if(!disposed&&current===generation&&allowed())api.start?.({showWidget:true});
          else stop();
        };
        if(api.start){api.start({showWidget:true});return;}
        if(document.getElementById(SCRIPT_ID))return;
        const script=document.createElement('script');
        script.id=SCRIPT_ID;script.async=true;script.charset='UTF-8';script.crossOrigin='anonymous';
        script.onerror=()=>{script.remove();stop();};
        script.src='https://embed.tawk.to/6a3e5336680a601d49f66f18/1js1na39r';
        document.body.appendChild(script);
      }catch{if(!disposed&&current===generation)stop();}
    };
    const onStorage=(event:StorageEvent)=>{if(event.key===CONSENT_KEY||event.key==='vancore_client_token'||event.key===null)void sync();};
    const update=()=>{void sync();};
    window.addEventListener(CONSENT_CHANGED,update);
    window.addEventListener('vancore:auth-changed',update);
    window.addEventListener('storage',onStorage);
    void sync();
    return()=>{disposed=true;generation++;window.removeEventListener(CONSENT_CHANGED,update);window.removeEventListener('vancore:auth-changed',update);window.removeEventListener('storage',onStorage);stop();};
  },[pathname]);
  return null;
}
