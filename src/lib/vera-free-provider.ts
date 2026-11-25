import 'server-only';
import { Buffer } from 'node:buffer';
import type { VeraTurn, VeraProviderIssue } from './vera-provider';

export type FreeProvider = 'groq'|'cloudflare';
export type InferenceAdmission = (action:'reserve'|'release',provider:FreeProvider,input:{units?:number;lease?:string;retryAfterSeconds?:number})=>Promise<{allowed:boolean;lease?:string;retryAfterSeconds?:number}>;
type Options={fetcher?:typeof fetch;maxTokens?:number;jsonMode?:boolean;reasoningEffort?:'low'|'medium'|'high';onUnavailable?:(issue:VeraProviderIssue)=>void;admission?:InferenceAdmission;env?:Record<string,string|undefined>;clock?:()=>number};
// Pinned, documented models. No arbitrary endpoint/model or paid gateway can be selected.
export const FREE_MODELS={groq:'openai/gpt-oss-120b',cloudflare:'@cf/openai/gpt-oss-120b'} as const;
async function storedAdmission(action:Parameters<InferenceAdmission>[0],provider:FreeProvider,input:Parameters<InferenceAdmission>[2]){
  const {inferenceAdmission}=await import('./vera-inference-budget');
  return inferenceAdmission(action,provider,input);
}
export function createFreeProvider({fetcher=fetch,maxTokens=4096,jsonMode=false,reasoningEffort,onUnavailable,admission=storedAdmission,env=process.env,clock=Date.now}:Options={}){
  return async(system:string,history:VeraTurn[],message:string)=>{
    const messages=[{role:'system',content:system},...history,{role:'user',content:message}];
    // Conservative byte bound, never silently discard client facts to fit a quota.
    const inputBound=Buffer.byteLength(JSON.stringify(messages))+512;
    if(inputBound>64000){onUnavailable?.({kind:'unavailable'});return null;}
    const outputLimit=Math.min(jsonMode?4096:1024,Math.max(512,Math.trunc(Number.isFinite(maxTokens)?maxTokens:4096)));
    const configurations=[
      {id:'groq' as const,key:env.GROQ_API_KEY,enabled:env.VERA_GROQ_FREE_CONFIRMED==='true',url:'https://api.groq.com/openai/v1/chat/completions'},
      {id:'cloudflare' as const,key:env.CLOUDFLARE_AI_TOKEN,enabled:env.VERA_CLOUDFLARE_FREE_CONFIRMED==='true'&&/^[a-f0-9]{32}$/.test(env.CLOUDFLARE_ACCOUNT_ID||''),url:'https://api.cloudflare.com/client/v4/accounts/'+env.CLOUDFLARE_ACCOUNT_ID+'/ai/v1/chat/completions'}
    ];
    const deadline=clock()+42000;let retry:number|undefined;
    for(const config of configurations){
      if(!config.enabled||!config.key)continue;
      // Groq's published free TPM is 8K. Keep room for its tokenizer/template overhead.
      if(config.id==='groq'&&inputBound+outputLimit>7500)continue;
      const remaining=deadline-clock();if(remaining<1000)break;
      const units=config.id==='groq'?inputBound+outputLimit:Math.ceil(inputBound*31818/1000000+outputLimit*68182/1000000);
      let grant:Awaited<ReturnType<InferenceAdmission>>;
      try{grant=await admission('reserve',config.id,{units});}catch{onUnavailable?.({kind:'unavailable'});return null;}
      if(!grant.allowed||!grant.lease){if(grant.retryAfterSeconds)retry=Math.min(retry??86400,grant.retryAfterSeconds);continue;}
      let cooldown=0;
      try{
        const response=await fetcher(config.url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(Math.min(20000,Math.max(1,deadline-clock()))),headers:{Authorization:'Bearer '+config.key,'Content-Type':'application/json'},body:JSON.stringify({model:FREE_MODELS[config.id],messages,max_completion_tokens:outputLimit,temperature:0.35,stream:false,...(jsonMode?{response_format:{type:'json_object'}}:{}),reasoning_effort:reasoningEffort||'low',...(config.id==='groq'?{include_reasoning:false}:{})})});
        if(response.status===429){
          const value=response.headers.get('retry-after');const seconds=value?(/^\d+$/.test(value)?Number(value):(Date.parse(value)-clock())/1000):NaN;
          cooldown=Number.isFinite(seconds)&&seconds>0?Math.max(1,Math.min(86400,Math.ceil(seconds))):60;
          retry=Math.min(retry??86400,cooldown);continue;
        }
        // Never log provider error bodies, cases, headers or credentials.
        if(!response.ok)continue;
        if(!response.body||Number(response.headers.get('content-length')||0)>262144)continue;
        const reader=response.body.getReader(),decoder=new TextDecoder();let raw='',size=0;
        try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>262144){await reader.cancel();throw Error('Oversized inference');}raw+=decoder.decode(part.value,{stream:true});}}finally{reader.releaseLock();}
        raw+=decoder.decode();const data=JSON.parse(raw),choice=data?.choices?.[0];
        if(choice?.finish_reason!=='stop'||typeof choice?.message?.content!=='string')continue;
        const reply=choice.message.content.replace(/<think>[\s\S]*?<\/think>/gi,'').replace(/<think>[\s\S]*$/gi,'').trim();
        if(!reply||reply.length>30000)continue;
        return{reply,model:config.id+':'+FREE_MODELS[config.id]};
      }catch{/* Failed attempts retain their reserved budget; no hidden retry on the same provider. */}
      finally{try{await admission('release',config.id,{lease:grant.lease,retryAfterSeconds:cooldown});}catch{/* Lease expiry bounds a storage outage; no further unsafe admission. */}}
    }
    onUnavailable?.(retry?{kind:'rate_limit',retryAfterSeconds:retry}:{kind:'unavailable'});return null;
  };
}
