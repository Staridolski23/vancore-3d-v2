export const CONSENT_KEY='vancore_cookie_consent';
export const CONSENT_CHANGED='vancore:consent-changed';
export const CONSENT_OPEN='vancore:open-cookie-settings';
export type CookieConsent={version:2;necessary:true;analytics:boolean;marketing:boolean;support:boolean;timestamp:string};
export const emptyConsent=():CookieConsent=>({version:2,necessary:true,analytics:false,marketing:false,support:false,timestamp:''});
export function readConsent(raw:string|null):CookieConsent|null {
  if(!raw)return null;
  try{
    const value=JSON.parse(raw);
    if(!value||typeof value!=='object'||value.necessary!==true||typeof value.timestamp!=='string'||!Number.isFinite(Date.parse(value.timestamp)))return null;
    return {version:2,necessary:true,analytics:value.analytics===true,marketing:value.marketing===true,support:value.version===2&&value.support===true,timestamp:value.timestamp};
  }catch{return null;}
}
export function storedConsent():CookieConsent|null{
  try{return readConsent(globalThis.localStorage?.getItem(CONSENT_KEY)??null);}catch{return null;}
}
