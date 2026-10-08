"""Preserve the approved take; apply restrained EQ and loudness preparation."""
import json, subprocess
from pathlib import Path

eq='equalizer=f=3500:t=q:w=0.7:g=-1.2,highshelf=f=7500:g=-1.2,deesser=i=0.10:m=0.12:f=0.5'
cmd=['ffmpeg','-hide_banner','-i','public/voice/nadeem-raw.mp3','-af',eq+',loudnorm=I=-17:TP=-1.5:LRA=9:print_format=json','-f','null','-']
first=subprocess.run(cmd,capture_output=True,text=True,check=True)
data=json.loads(first.stderr[first.stderr.rfind('{'):])
norm=f"loudnorm=I=-17:TP=-1.5:LRA=9:measured_I={data['input_i']}:measured_TP={data['input_tp']}:measured_LRA={data['input_lra']}:measured_thresh={data['input_thresh']}:offset={data['target_offset']}:linear=true:print_format=json"
out=subprocess.run(['ffmpeg','-y','-hide_banner','-i','public/voice/nadeem-raw.mp3','-af',eq+','+norm,'-ar','48000','-ac','2','-c:a','pcm_s16le','public/voice/nadeem-soft.wav'],capture_output=True,text=True,check=True)
Path('review/voice-processing.json').write_text(json.dumps({'equalization':eq,'tempoChanged':False,'pitchChanged':False,'rawPreserved':True,'firstPass':data,'secondPass':json.loads(out.stderr[out.stderr.rfind('{'):])},indent=2)+'\n')
print('Prepared narration; raw recording preserved, no tempo or pitch changes.')
