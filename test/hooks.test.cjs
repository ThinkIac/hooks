const {test}=require('node:test'),assert=require('node:assert/strict');
const path = require('node:path');
const { loadType } = require(path.join(process.env.LOGOS_ROOT, 'vendor/packages/logos/dist/src/kernel/type-source.js'));
const { provideHooks } = loadType(path.resolve(__dirname, '../src/index.type'));
function fixture(options={}) {
 const calls=[],events=[],hooks=[{event:'one',call:async p=>p+1},{event:'two',priority:0,call:async p=>p+2}];
 const host={on:(...a)=>events.push(a),scopes:{get:()=>options.previous,dispose:async(...a)=>calls.push(['dispose',...a]),removeOwner:x=>calls.push(['remove',x]),create:()=>({id:1})},http:{isolatedRunner:()=>options.runner,resolveMiddlewares:async()=>[],runMiddlewares:async(m,c,fn)=>fn()},scanHooks:async()=>{if(options.fail)throw Error('scan');return hooks},resolveConditions:async()=>!options.denied,tools:{authority:()=>({enforce:r=>{calls.push(['authority',r]);if(options.forbidden)throw Error('denied')}})}};
 return {host,calls,events,hooks,module:provideHooks(host)};
}
test('distinct closures, priority zero, context and middleware',async()=>{const f=fixture();assert.equal(await f.module.api.wirePackageHooks({folder:'p'}),2);assert.equal(await f.events[0][1](1),2);assert.equal(await f.events[1][1](1),3);assert.equal(f.events[1][2].priority,0);assert.equal(f.events[0][2].operation,'transform');});
test('rewire disposes old scope',async()=>{const f=fixture({previous:{}});await f.module.api.wirePackageHooks({folder:'p'});assert.deepEqual(f.calls[0],['dispose','p','hooks_rewired']);});
test('false condition does not execute hook',async()=>{const f=fixture({denied:true});await f.module.api.wirePackageHooks({folder:'p'});assert.equal(await f.events[0][1](1),undefined);});
test('scanner failure returns zero',async()=>{const f=fixture({fail:true});assert.equal(await f.module.api.wirePackageHooks({folder:'p'}),0);});
test('isolated runner bypasses scanner',async()=>{const f=fixture({fail:true,runner:{surfaces:{hooks:[{id:'h',event:'e'}]},invoke:async(id,args)=>[id,...args]}});await f.module.api.wirePackageHooks({folder:'p'});assert.deepEqual(await f.events[0][1](5),['h',5]);});
test('validation enforces authority and registers lifecycle',async()=>{const f=fixture();f.module.install();const result={};await f.events.find(e=>e[0]==='logos:package:validating')[1]({pkg:{folder:'p'},result});assert.equal(result.hooks,2);assert.equal(f.calls.filter(c=>c[0]==='authority').length,2);assert.equal(f.events.find(e=>e[0]==='package:wiring')[2].priority,40);});
test('authority rejection propagates',async()=>{const f=fixture({forbidden:true});f.module.install();await assert.rejects(f.events[0][1]({pkg:{folder:'p'},result:{}}),/denied/);});
