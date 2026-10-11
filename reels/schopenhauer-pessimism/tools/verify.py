import subprocess,json,re,hashlib
from pathlib import Path
r=Path(__file__).resolve().parents[1];p=r/'output/final_reel.mp4'
def run(*a):return subprocess.run(a,capture_output=True,text=True)
probe=json.loads(run('ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)).stdout)
dec=run('ffmpeg','-v','error','-i',str(p),'-f','null','-')
scan=run('ffmpeg','-hide_banner','-i',str(p),'-vf','blackdetect=d=0.1:pix_th=.1,freezedetect=n=-55dB:d=3','-af','silencedetect=noise=-50dB:d=0.8,ebur128=peak=true','-f','null','-')
(r/'output/qa-scan.log').write_text(scan.stderr)
last=scan.stderr.rsplit('Summary:',1)[-1]
LUFS=re.search(r'I:\s*([-\d.]+) LUFS',last);tp=re.search(r'Peak:\s*([-\d.]+) dBFS',last)
res=dict(probe=probe,decodeExit=dec.returncode,decodeErrors=dec.stderr,black=[l for l in scan.stderr.splitlines() if 'black_start:' in l],freezes=[l for l in scan.stderr.splitlines() if 'freeze_start:' in l],silences=[l for l in scan.stderr.splitlines() if 'silence_start:' in l],integratedLUFS=float(LUFS[1]) if LUFS else None,truePeakDBTP=float(tp[1]) if tp else None,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest())
# Every spoken segment must align with the exported audio. Downmix final and compare globally.
subprocess.run(['ffmpeg','-v','error','-y','-i',str(p),'-ac','1','-ar','8000','-f','f32le',str(r/'work/final.f32')],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(r/'public/mix.wav'),'-ac','1','-ar','8000','-f','f32le',str(r/'work/mix.f32')],check=True)
import numpy as np
x=np.fromfile(r/'work/final.f32',np.float32);y=np.fromfile(r/'work/mix.f32',np.float32)
segments=[]
for t in [1,9,17,27,35,45,51,60,64]:
 st=int(t*8000);nn=8000
 scores=[]
 for lag in range(-400,401):
  a=x[st+lag:st+lag+nn];b=y[st:st+nn]
  if len(a)==len(b):scores.append((float(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b)+1e-12)),lag))
 sc,lag=max(scores);segments.append(dict(at=t,offsetMs=lag/8,correlation=sc))
res['audioSync']=segments
c=json.loads((r/'src/captions.json').read_text());res['captions']={'count':len(c),'maxCharactersPerSecond':max(len(i['text'])/(i['end']-i['start']) for i in c),'minSeconds':min(i['end']-i['start'] for i in c)}
(r/'output/qa-technical.json').write_text(json.dumps(res,indent=2))
print(json.dumps({k:v for k,v in res.items() if k!='probe'},indent=2))
