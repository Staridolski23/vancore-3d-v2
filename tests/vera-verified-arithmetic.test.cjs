const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadVera}=require('./helpers/vera-module.cjs');
const {verifiedGrossMargin}=loadVera('src/lib/vera-verified-arithmetic.ts');
const question='Приходите са 120000 EUR на месец, себестойността на продажбите е 90000 EUR за същия месец. Какъв е брутният марж?';
test('explicit same-month gross margin works without claiming AI inference or charging an AI question',()=>{
 const r=verifiedGrossMargin(question);assert.equal(r.mode,'limited');assert.equal(r.model,null);assert.equal(r.engine,'verified_arithmetic');assert.equal(r.calculations[0].result,25);assert.match(r.reply,/Gross margin: 25 %/);assert.match(r.reply,/без заявка към AI/);assert.match(r.reply,/Не е използван AI въпрос/);assert.equal(r.calculations[0].inputs[0].quote,question);
 assert.equal(verifiedGrossMargin('Revenue 100 USD and cost of sales 120 USD for the same month. What is gross margin?').calculations[0].result,-20);
 assert.equal(verifiedGrossMargin('Revenue 500 EUR and COGS 499 EUR for the same month. Gross margin?').calculations[0].result,0.2);
});
test('ambiguous amounts, currencies, periods, cost definitions and denominators never become calculator success',()=>{
 for(const q of [question.replace('120000','0'),question.replace('90000 EUR','90000 USD'),question.replace('същия месец','предходния месец'),question.replace('на месец','годишно'),question.replace('себестойността на продажбите','разходите'),question+' Преди приходите бяха 100000.',question.replace('120000','около 120000'),question.replace('120000','120 хиляди'),question.replace('120000','120 000'),question.replace('90000','-90000')])assert.equal(verifiedGrossMargin(q),null,q);
 assert.equal(verifiedGrossMargin('Какъв е маржът?'),null);
});
test('the verified tool path needs neither the inference provider nor the shared corpus',async()=>{
 const answers=loadVera('src/lib/vera-answers.ts',{'./vera-provider':{createVeraProvider:()=>async()=>{throw Error('No model call permitted');}},'./vera-knowledge-server':{veraKnowledge:{businessMethod:async()=>{throw Error('No corpus access required for explicit arithmetic');}}}});
 const r=await answers.answerVera([],question);assert.equal(r.calculations[0].result,25);assert.equal(r.mode,'limited');
});
