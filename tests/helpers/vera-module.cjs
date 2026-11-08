// Execute the actual TypeScript API against injected dependencies; never a browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function loadVera(relative,mocks={}){
 const filename=path.join(root,relative),module={exports:{}};
 const output=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const requireFixture=id=>{
  if(Object.hasOwn(mocks,id))return mocks[id];
  if(id==='server-only')return{};
  if(id.startsWith('node:'))return require(id);
  if(id.startsWith('./'))return loadVera(path.relative(root,path.resolve(path.dirname(filename),id+'.ts')),mocks);
  throw Error('Unexpected API dependency '+id);
 };
 vm.runInNewContext('(function(require,module,exports){'+output+'\n})',{process,Request,Response,Headers,URL,console,AbortSignal})(requireFixture,module,module.exports);
 return module.exports;
}
module.exports={loadVera};
