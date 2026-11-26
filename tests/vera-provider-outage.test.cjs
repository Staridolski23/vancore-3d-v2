const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadVera}=require('./helpers/vera-module.cjs');
test('chat, valid numerical input, legal research and reports explain provider cooldown without accepting an AI result or blaming client evidence',async()=>{
 const real=loadVera('src/lib/vera-provider.ts');
 const mocks={'./vera-provider':{...real,createVeraProvider:options=>async()=>{options?.onUnavailable?.({kind:'rate_limit',retryAfterSeconds:389});return null;}}};
 const answers=loadVera('src/lib/vera-answers.ts',mocks),business=loadVera('src/lib/vera-business-answer.ts',mocks),legal=loadVera('src/lib/vera-legal.ts',mocks),analysis=loadVera('src/lib/vera-analysis.ts',mocks);
 const legalResearch=legal.createLegalResearch({fresh:async()=>({versionId:'00000000-0000-4000-8000-000000000099',sha256:'a'.repeat(64),retrievedAt:new Date().toISOString(),provisions:[{article:'Чл. 9.',text:'Synthetic provision about freedom of contract and mandatory rules. Not actual law.'}]}),fetcher:async()=>{throw Error('No public fetch expected');}});
 const results=await Promise.all([
  answers.answerVera([],'Имам забавяне при обработката на поръчки.'),
  business.createBusinessAnswer()([],'Приходи 120000 EUR и себестойност 90000 EUR за същия месец. Какъв е брутният марж?'),
  legalResearch([],'България, към днешна дата: договор за услуги, чл. 9.'),
  analysis.analyseVera([],'Изготви анализ',{notes:'',sources:[{requestId:'synthetic-1',statement:'Обработката на поръчки се забавя в склада.'}],totalCompletedRequests:1,selectedSources:1,scope:'Synthetic QA'})
 ]);
 for(const result of results){assert.equal(result.mode,'limited');assert.equal(result.model,null);assert.match(result.reply,/389 секунди/);assert.match(result.reply,/не означава грешка/);assert.match(result.reply,/Не е използван въпрос/);assert.equal(result.analysis,undefined);assert.doesNotMatch(result.reply,/Уточни входните стойности/);}
});
