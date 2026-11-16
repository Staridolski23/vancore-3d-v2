// Operator-side preparation of a fixed approved public source. No credentials or cloud writes.
// Usage: node scripts/prepare-vera-legal-ingestion.cjs SOURCE_ID INPUT_HTML OUTPUT_JSON
const fs=require('node:fs'),{createHash}=require('node:crypto');
const {loadVera}=require('../tests/helpers/vera-module.cjs');
const legal=loadVera('src/lib/vera-legal.ts');
const source=legal.LEGAL_SOURCES.find(s=>s.id===process.argv[2]);
if(!source||!process.argv[3]||!process.argv[4])throw Error('Choose an approved source and explicit input/output paths');
const html=fs.readFileSync(process.argv[3],'utf8'),content=legal.officialText(html),provisions=legal.legalProvisions(html,source);
if(provisions.length<20||provisions.length>2000||Buffer.byteLength(content)>2500000)throw Error('Unverified or oversized document');
const offsets=new Int32Array(content.length+1);let count=0;
for(let i=0;i<content.length;){const size=content.codePointAt(i)>0xffff?2:1;offsets[i]=count;if(size===2)offsets[i+1]=count;i+=size;offsets[i]=++count;}
const spans=provisions.map(p=>{
 let low=0,high=p.text.length;
 while(low<high){const mid=Math.ceil((low+high)/2);if(content.includes(p.text.slice(0,mid)))low=mid;else high=mid-1;}
 if(low<35)throw Error('Provision cannot be located in the full source text');
 const prefix=p.text.slice(0,low),index=content.indexOf(prefix);
 return{label:p.article,pos:offsets[index]+1,size:Array.from(prefix).length};
});
const result={sourceId:source.id,url:source.url,content,sha256:createHash('sha256').update(content).digest('hex'),originalHtmlSha256:createHash('sha256').update(html).digest('hex'),format:'full-normalised-text',spans};
fs.writeFileSync(process.argv[4],JSON.stringify(result));
console.log(JSON.stringify({sourceId:source.id,provisions:spans.length,contentBytes:Buffer.byteLength(content),compactBytes:Buffer.byteLength(JSON.stringify(result)),sha256:result.sha256,format:result.format,reviewStatus:'unreviewed'}));
