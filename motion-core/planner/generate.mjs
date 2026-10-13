#!/usr/bin/env node
/**
 * Run: npm run planner:generate -- planner/demo-brief.json demo/output/ai-storyboard.json
 *
 * This CLI ONLY creates a validated candidate JSON. It never edits published
 * reels, changes a committed storyboard, or renders a video automatically.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fromSegmentedWhisperWords} from '../dist/core.js';
import {generateStoryboard} from './ai-planner.mjs';

const [briefFile,outputFile]=process.argv.slice(2);
if(!briefFile||!outputFile){
 console.error('Usage: node planner/generate.mjs <brief.json> <new-output.json>');
 process.exitCode=2;
}else{
 try {
  const config=JSON.parse(await readFile(resolve(briefFile),'utf8'));
  if(!config||typeof config!=='object'||typeof config.wordsFile!=='string')
   throw new Error('brief.wordsFile is required');
  if(typeof config.description!=='string'||!config.description.trim())
   throw new Error('brief.description is required');
  const input=JSON.parse(await readFile(resolve(config.wordsFile),'utf8'));
  if(!Array.isArray(input))throw new Error('wordsFile must contain a JSON array');
  const fps=config.fps??30,durationMs=config.durationMs;
  const words=fromSegmentedWhisperWords(input)
   .filter(word=>word.startMs>=0&&word.endMs<=durationMs);
  if(!words.length)throw new Error('no aligned words in selected duration');
  const provider=process.env.BASEERA_AI_PROVIDER??'anthropic';
  const model=process.env.BASEERA_AI_MODEL;
  const candidate=await generateStoryboard({
   brief:config,words,fps,durationMs,provider,model
  });
  const target=resolve(outputFile);
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,JSON.stringify(candidate,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('Validated candidate storyboard written to '+target);
  console.log('Review before rendering: '+candidate.shots.length+' shots, '+candidate.cues.length+' cues.');
 }catch(error){
  // Never print provider body or API keys; errors here come from validated
  // local input or carefully bounded provider status messages.
  console.error('Generation did not publish a storyboard: '+String(error?.message??'unknown error'));
  process.exitCode=1;
 }
}
