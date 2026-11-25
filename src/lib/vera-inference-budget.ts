import 'server-only';
import { supabaseAdmin } from './supabase';
import type { InferenceAdmission } from './vera-free-provider';
export const inferenceAdmission:InferenceAdmission=async(action,provider,input)=>{
  const {data,error}=await supabaseAdmin.rpc('vancore_vera_inference_budget',{p_action:action,p_provider:provider,p_units:input.units||0,p_lease:input.lease||null,p_retry:input.retryAfterSeconds||0});
  if(error||!data||typeof data.allowed!=='boolean')throw Error('Inference admission unavailable');
  if(data.allowed&&action==='reserve'&&!/^[a-f0-9-]{36}$/.test(data.lease||''))throw Error('Invalid inference lease');
  const retry=Number(data.retryAfterSeconds);
  return{allowed:data.allowed,...(data.lease?{lease:String(data.lease)}:{}),...(Number.isFinite(retry)&&retry>0?{retryAfterSeconds:Math.max(1,Math.min(86400,Math.ceil(retry)))}:{})};
};
