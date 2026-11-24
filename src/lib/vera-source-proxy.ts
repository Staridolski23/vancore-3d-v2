import 'server-only';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

const supported = new Set(['bg-obligations','bg-commerce','bg-labour','eu-gdpr']);
// Request-scoped bearer is sent only to the existing VANCORE backend, never to a law site or model.
export function createSourceProxy(authorization?: string | null, {fetcher=fetch,clock=Date.now}: {fetcher?:typeof fetch;clock?:()=>number}={}) {
  return async (source:{id:string;url:string}) => {
    if (!authorization?.startsWith('Bearer ') || !supported.has(source.id)) return null;
    const response = await fetcher('https://api.vancoresys.com/api/legal-sources/'+source.id,{
      redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{Authorization:authorization,Accept:'application/json'}
    });
    if(!response.ok||!/application\/json/i.test(response.headers.get('content-type')||'')||!response.body)throw Error('Source transport unavailable');
    const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
    try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>4000000){await reader.cancel();throw Error('Source transport oversized');}text+=decoder.decode(part.value,{stream:true});}}finally{reader.releaseLock();}
    text+=decoder.decode();const data=JSON.parse(text),age=clock()-Date.parse(data.downloadedAt);
    if(data.sourceId!==source.id||data.url!==source.url||typeof data.html!=='string'||Buffer.byteLength(data.html)>2500000||!Number.isFinite(age)||age< -120000||age>120000||data.sha256!==createHash('sha256').update(data.html).digest('hex'))throw Error('Source transport metadata mismatch');
    return{html:data.html as string,retrievedAt:data.downloadedAt as string};
  };
}
