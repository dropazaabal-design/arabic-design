import test from 'node:test';
import assert from 'node:assert/strict';
import {
 parseStoryboardJson,makePrompt,requestModelText,validateAIDirection,generateStoryboard
} from '../ai-planner.mjs';

const words=[
 {id:'s01:0',text:'لا',startMs:200,endMs:360},
 {id:'s01:1',text:'ترسلها',startMs:410,endMs:800},
 {id:'s02:0',text:'فكّر',startMs:1100,endMs:1450},
 {id:'s02:1',text:'أولًا',startMs:1620,endMs:2000}
];
const brief={
 description:'شخص يتردد قبل إرسال رسالة متسرعة، ويتذكر أن لديه خيارًا',
 goal:'حركة قصصية عربية غير جامدة',
 actors:[{id:'hero',role:'صاحب الرسالة'},{id:'other',role:'الصديق'}]
};
const candidate=()=>({
 version:1,language:'ar',description:'التردد ثم القرار',
 actors:structuredClone(brief.actors),
 cues:[
  {id:'entry',wordId:'s01:0',expectedWord:'لا',actorId:'hero',
   direction:'enter',durationMs:410,distance:120,
   visualReason:'دخول الشخصية قبل وقوع الموقف'},
  {id:'think',wordId:'s02:0',expectedWord:'فكّر',actorId:'hero',
   direction:'hesitate',durationMs:500,visualReason:'تردد يتبع سؤال الراوي'},
  {id:'partner',wordId:'s02:1',expectedWord:'أولًا',actorId:'other',
   direction:'notice',durationMs:350,visualReason:'الصديق ينتبه إلى التغير'}
 ],
 shots:[
  {id:'one',fromWordId:'s01:0',toWordId:'s01:1',camera:'wide',
   focusActorId:'hero',visualReason:'افتتاح يؤسس المكان والشخصية'},
  {id:'two',fromWordId:'s02:0',toWordId:'s02:1',camera:'medium',
   focusActorId:'other',screenText:'فكّر أولًا',visualReason:'نقلة إلى لحظة القرار'}
 ]
});
const input=()=>({brief,words,fps:30,durationMs:2800});
test('planner creates grounded prompt with actual word IDs and no English screen copy',()=>{
 const p=makePrompt(input());
 assert.match(p.user,/s01:0/);
 assert.match(p.user,/ترسلها/);
 assert.match(p.system,/JSON/);
 assert.equal(p.aligned.length,words.length);
});
test('validated storyboard compiles to timed motion without touching TSX',()=>{
 const p=validateAIDirection(candidate(),brief,words,30,2800);
 assert.equal(p.cues.length,3);
 assert.equal(p.shots.length,2);
});
test('Anthropic Messages adapter sends expected headers and JSON',async()=>{
 let req;
 const fetchImpl=async(url,options)=>{
  req={url,options};
  return {ok:true,text:async()=>JSON.stringify({content:[{type:'text',text:JSON.stringify(candidate())}],stop_reason:'end_turn'})};
 };
 const result=await generateStoryboard({...input(),provider:'anthropic',model:'test-claude',
  env:{ANTHROPIC_API_KEY:'fake-secret'},fetchImpl});
 assert.equal(result.shots.length,2);
 assert.equal(req.url,'https://api.anthropic.com/v1/messages');
 assert.equal(req.options.headers['x-api-key'],'fake-secret');
 assert.equal(JSON.parse(req.options.body).max_tokens,5000);
 assert.equal(JSON.parse(req.options.body).model,'test-claude');
});
test('OpenAI Responses adapter parses output_text and disables state retention',async()=>{
 let request;
 const fetchImpl=async(url,options)=>{
  request={url,options};
  return {ok:true,text:async()=>JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(candidate())}]}]})};
 };
 const result=await generateStoryboard({...input(),provider:'openai',model:'test-openai',
  env:{OPENAI_API_KEY:'dummy'},fetchImpl});
 assert.equal(result.actors.length,2);
 assert.equal(request.url,'https://api.openai.com/v1/responses');
 const body=JSON.parse(request.options.body);
 assert.equal(body.store,false);
 assert.equal(body.model,'test-openai');
});
test('missing keys and model stop network calls before request',async()=>{
 let calls=0;
 const fetchImpl=async()=>{calls++;throw new Error('should not call')};
 await assert.rejects(requestModelText({
  provider:'anthropic',model:'a',system:'x',user:'y',env:{},fetchImpl
 }),/missing provider API key/);
 await assert.rejects(requestModelText({
  provider:'openai',model:'',system:'x',user:'y',env:{OPENAI_API_KEY:'x'},fetchImpl
 }),/BASEERA_AI_MODEL/);
 assert.equal(calls,0);
});
test('HTTP failures reveal status only, never response contents',async()=>{
 const err=await requestModelText({
  provider:'anthropic',model:'a',system:'x',user:'y',
  env:{ANTHROPIC_API_KEY:'secret'},fetchImpl:async()=>({ok:false,status:401})
 }).catch(e=>e.message);
 assert.match(err,/HTTP 401/);
 assert.doesNotMatch(err,/secret/);
});
test('malformed or fenced JSON rejected, not repaired implicitly',()=>{
 assert.throws(()=>parseStoryboardJson('```json\\n{}\\n```'),/single JSON object/);
 assert.throws(()=>parseStoryboardJson('[]'),/JSON object/);
});
test('unknown actor or changed role rejected after schema validation',()=>{
 const x=candidate();x.actors[1].role='دور مختلف';
 assert.throws(()=>validateAIDirection(x,brief,words,30,2800),/unauthorized character/);
 const y=candidate();y.actors[1].id='third';y.cues[2].actorId='third';y.shots[1].focusActorId='third';
 assert.throws(()=>validateAIDirection(y,brief,words,30,2800),/unauthorized character/);
});
test('wrong word anchors are never accepted',()=>{
 const x=candidate();x.cues[0].expectedWord='نعم';
 assert.throws(()=>validateAIDirection(x,brief,words,30,2800),/word text mismatch/);
 const y=candidate();y.shots[1].fromWordId='s99:99';
 assert.throws(()=>validateAIDirection(y,brief,words,30,2800),/unknown word anchor/);
});
test('motion overlap validation applies to generated plans as well',()=>{
 const x=candidate();
 x.cues[0].durationMs=1300;
 x.cues[1].direction='enter';
 x.cues[1].distance=90;
 assert.throws(()=>validateAIDirection(x,brief,words,30,2800),/overlapping position/);
});
test('provider truncation or incomplete output is not accepted',async()=>{
 await assert.rejects(requestModelText({
  provider:'anthropic',model:'m',system:'x',user:'y',
  env:{ANTHROPIC_API_KEY:'x'},fetchImpl:async()=>({
   ok:true,text:async()=>JSON.stringify({stop_reason:'max_tokens',content:[{type:'text',text:'{}'}]})
  })
 }),/truncated Anthropic/);
 await assert.rejects(requestModelText({
  provider:'openai',model:'m',system:'x',user:'y',
  env:{OPENAI_API_KEY:'x'},fetchImpl:async()=>({
   ok:true,text:async()=>JSON.stringify({status:'incomplete',output:[]})
  })
 }),/incomplete OpenAI/);
});
