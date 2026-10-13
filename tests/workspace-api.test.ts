import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';

test('save RPC requests a single row and returns the saved document',async()=>{
 const doc={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',room_id:'room-test',title:'共写',body:'一起写',category:'writing',status:'draft',version:1,author_id:'a',updated_by:'a',created_at:'2026-10-13T00:00:00Z',updated_at:'2026-10-13T00:00:00Z'};
 let calls=0;
 const db=createClient('https://workspace-test.supabase.co','test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
  calls++;assert.match(String(input),/rpc\/reverie_save_document/);assert.equal(new Headers(init?.headers).get('Accept'),'application/vnd.pgrst.object+json');
  const payload=JSON.parse(init!.body as string);assert.equal(payload._version,0);assert.equal(payload._room,'room-test');
  return new Response(JSON.stringify(doc),{status:200,headers:{'Content-Type':'application/json'}});
 }}});
 db.auth.getUser=async()=>({data:{user:{id:'a'} as any},error:null});
 (globalThis as any).__workspaceDb=db;
 let source=readFileSync('src/lib/workspace/api.ts','utf8').replace(/import \{ supabase \}[^\n]+\n/,'const supabase=globalThis.__workspaceDb;\n');
 source=source.replace(/(["'])\.\/model\1/,JSON.stringify(pathToFileURL(join(process.cwd(),'src/lib/workspace/model.ts')).href)).replace(/(["'])\.\.\/rooms\/model\1/,JSON.stringify(pathToFileURL(join(process.cwd(),'src/lib/rooms/model.ts')).href));
 const dir=mkdtempSync(join(process.cwd(),'.workspace-test-'));const file=join(dir,'api.mjs');writeFileSync(file,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 try{const {saveDocument}=await import(pathToFileURL(file).href);const saved=await saveDocument({...doc,version:0},'a');assert.equal(saved.id,doc.id);assert.equal(saved.version,1);assert.equal(calls,1);await assert.rejects(()=>saveDocument({...doc,version:0},'other'),/账户已变化/);assert.equal(calls,1);}finally{rmSync(dir,{recursive:true,force:true});delete (globalThis as any).__workspaceDb;}
});
