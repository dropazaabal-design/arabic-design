"""Original score and effects for both reels, synthesised from the beat sheets (no samples, no licences, seeded).

A: the taunt (sol-mi-la-sol-mi) on the laughs, whooshes and thuds for the bricks, a heartbeat that quickens while
   each brick he sets rings one step higher, an impact at the summit, silence, then a warm D major for the ladder.
B: oud-like plucks in maqam Hijaz on D over a drone and a frame drum; shovel, water and footsteps on their beats;
   a tick for every year on the counter; the drum stops when the old man is gone and comes back with the planting.

usage: python3 tools/music.py   → public/audio/a-mix.wav, b-mix.wav (48 kHz stereo, −16 LUFS, limited)
"""
import json
import re
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 48000
root = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(11)
TARGET_LUFS, TP_LIMIT = -16.0, -4.5  # as the series: the limiter sits below −4 dBTP because AAC overshoots


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r, hold=None):
    """Attack, optional hold, exponential-ish release over n samples."""
    e = np.ones(n)
    a = max(1, int(a * SR))
    e[:a] = np.linspace(0, 1, a)
    if r:
        r = min(n, max(1, int(r * SR)))
        e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def band(x, lo, hi):
    """Smooth band-pass in the frequency domain."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g, len(x))


def noise(d):
    return rng.standard_normal(int(d * SR))


def hz(note):
    """'D4', 'Eb4', 'F#5' → Hz."""
    m = re.match(r'([A-G])(#|b)?(-?\d)', note)
    n = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[m[1]] + {'#': 1, 'b': -1, None: 0}[m[2]] + 12 * (int(m[3]) + 1)
    return 440 * 2 ** ((n - 69) / 12)


# ——— instruments ———
def pluck(f, d=1.6, bright=0.5, decay=0.996):
    """Karplus–Strong string (oud-like when dull, harp-like when bright); vectorised one period at a time."""
    N = max(2, int(SR / f))
    y = np.zeros(int(d * SR) + N + 1)
    y[:N + 1] = band(rng.uniform(-1, 1, N * 4), 60, 1500 + 6000 * bright)[:N + 1]
    k = N + 1
    while k < len(y) - 1:
        e = min(len(y), k + N)
        y[k:e] = decay * 0.5 * (y[k - N:e - N] + y[k - N - 1:e - N - 1])
        k = e
    y = y[N:N + int(d * SR)]
    return y / (np.abs(y).max() + 1e-9) * env(len(y), 0.002, 0.08)


def bell(f, d=2.0, dec=3.0):
    """Struck partials (soft piano / mallet)."""
    x = tt(d)
    y = sum(a * np.sin(2 * np.pi * f * m * x) * np.exp(-x * dec * m ** 0.7) for m, a in [(1, 1), (2, 0.45), (3, 0.2), (4.2, 0.08)])
    return y * env(len(x), 0.004, 0.2)


def pad(freqs, d, a=0.6, r=1.0):
    x = tt(d)
    y = sum(np.sin(2 * np.pi * f * (1 + dt) * x + 0.3 * np.sin(2 * np.pi * 0.2 * x)) * (0.8 if k == 0 else 0.5) + 0.18 * np.sin(4 * np.pi * f * x)
            for k, f in enumerate(freqs) for dt in (-0.003, 0.003))
    return y / (2 * len(freqs)) * env(len(x), a, r)


def kick(f0=110, f1=45, d=0.45, click=0.3):
    x = tt(d)
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-x * 30)) / SR
    return (np.sin(ph) * np.exp(-x * 7) + click * band(noise(d), 1500, 6000) * np.exp(-x * 120)) * env(len(x), 0.001, 0.05)


def thud(d=0.5, low=1.0):
    x = tt(d)
    return (low * np.sin(2 * np.pi * np.cumsum(70 - 30 * x / d) / SR) * np.exp(-x * 9) + 0.6 * band(noise(d), 80, 700) * np.exp(-x * 22)) * env(len(x), 0.001, 0.05)


def whoosh(d=0.5, lo=300, hi=3000):
    n = noise(d)
    half = len(n) // 2
    y = np.concatenate([band(n[:half], lo, hi * 0.6), band(n[half:], lo * 1.4, hi)])
    return y * np.sin(np.linspace(0, np.pi, len(y))) ** 2


def tick(f=2600, d=0.03):
    x = tt(d)
    return np.sin(2 * np.pi * f * x) * np.exp(-x * 160)


def pop():
    x = tt(0.09)
    return np.sin(2 * np.pi * np.cumsum(420 + 700 * x / 0.09) / SR) * np.exp(-x * 40)


def impact(d=2.6):
    x = tt(d)
    boom = np.sin(2 * np.pi * np.cumsum(60 - 25 * x / d) / SR) * np.exp(-x * 2.2)
    crash = band(noise(d), 2500, 12000) * np.exp(-x * 2.8) * 0.5
    return kick(140, 40, d, 0.6) * 0.8 + boom + crash


def crunch(d=0.28):
    x = tt(d)
    grains = (rng.random(len(x)) < 0.004).astype(float)
    grains = np.convolve(grains, np.hanning(120), 'same')
    return band(noise(d), 300, 3500) * (0.25 + grains) * np.exp(-x * 9)


def trickle(d):
    x = tt(d)
    y = band(noise(d), 600, 5000) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * x))
    for t0 in rng.uniform(0, d - 0.05, int(d * 40)):
        b = tt(0.04)
        s = int(t0 * SR)
        y[s:s + len(b)] += 0.4 * np.sin(2 * np.pi * np.cumsum(900 + 1400 * b / 0.04 + rng.uniform(-200, 200)) / SR) * np.exp(-b * 90)
    return y * env(len(x), 0.05, 0.1)


def step():
    x = tt(0.12)
    return band(noise(0.12), 80, 900) * np.exp(-x * 40)


def dum():
    return kick(95, 62, 0.42, 0.08) + 0.15 * band(noise(0.42), 150, 900) * np.exp(-tt(0.42) * 25)


def tak():
    x = tt(0.08)
    return band(noise(0.08), 1400, 6500) * np.exp(-x * 60) * 0.9


def reverb(x, d=1.8, wet=0.25):
    ir = noise(d) * np.exp(-tt(d) * 3.2 / d * 2)
    ir = band(ir, 200, 7000)
    ir /= np.sqrt((ir ** 2).sum())
    n = len(x) + len(ir)
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
    return x + wet * y


class Mix:
    def __init__(self, d):
        self.L = np.zeros(int(d * SR) + SR)
        self.R = np.zeros_like(self.L)
        self.d = d

    def add(self, t, sig, gain=1.0, pan=0.0):
        s = int(round(t * SR))
        if s >= len(self.L):
            return
        sig = sig[:len(self.L) - s] * gain
        self.L[s:s + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
        self.R[s:s + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)

    def out(self, name, rev=0.22):
        n = int(self.d * SR)
        L, R = reverb(self.L, wet=rev)[:n], reverb(self.R, wet=rev)[:n]
        fade = int(0.25 * SR)
        L[-fade:] *= np.linspace(1, 0, fade)
        R[-fade:] *= np.linspace(1, 0, fade)
        st = np.stack([L, R], 1)
        st /= np.abs(st).max() * 1.05
        raw = root / f'audio/{name}-raw.wav'
        raw.parent.mkdir(exist_ok=True)
        with wave.open(str(raw), 'wb') as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes((st * 32767).astype('<i2').tobytes())
        master(raw, root / f'public/audio/{name}-mix.wav')


def loud(path):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o)[-1])


def master(raw, out):
    lim = 10 ** (TP_LIMIT / 20)
    gain = round(TARGET_LUFS - loud(raw)[0], 2)
    for _ in range(4):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af',
                        f'volume={gain}dB,aresample=192000,alimiter=limit={lim:.4f}:level=false:attack=1:release=60,aresample=48000', '-ar', '48000', '-ac', '2', str(out)], check=True)
        lufs, tp = loud(out)
        if abs(lufs - TARGET_LUFS) < 0.2:
            break
        gain = round(gain + TARGET_LUFS - lufs, 2)
    print(out.name, f'{lufs:.1f} LUFS', f'{tp:.1f} dBTP')


def bezier(x1, y1, x2, y2):
    """CSS cubic-bezier easing, as remotion's Easing.bezier (used to replay the on-screen counter)."""
    def f(x):
        t = x
        for _ in range(20):
            bx = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3
            dx = 3 * (1 - t) ** 2 * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2)
            t = min(1, max(0, t - (bx - x) / (dx or 1e-6)))
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3
    return f


# ——— A ———
def score_a():
    b = json.loads((root / 'src/a/beats.json').read_text(encoding='utf-8'))
    m = Mix(b['duration'])
    D = [hz(n) for n in ('D2', 'A2')]
    # the taunt on the laughs, over a low drone
    m.add(0, pad(D, 3.6, 0.3, 1.0), 0.5)
    for t, n in zip(b['laughs'], ['G5', 'E5', 'A5', 'G5', 'E5']):
        m.add(t, pluck(hz(n), 0.5, 0.9, 0.99), 0.55, 0.2)
        m.add(t, pluck(hz(n) / 2, 0.4, 0.6, 0.99), 0.3, -0.2)
    m.add(1.7, pad([hz('D2'), hz('Eb3')], 2.0, 0.4, 0.6), 0.35)
    for v in b['volley']:
        m.add(v['t0'], whoosh(v['dur'], 400, 3500), 0.35, -0.5 + 0.15 * v['who'])
        m.add(v['t0'] + v['dur'], thud(0.4, 1.0 if v['to'][1] == 1340 else 0.3), 0.6 if v['to'][1] == 1340 else 0.2, 0.3)
    # the catch: whoosh, slap, the word turned face down, set down
    c = b['catch']
    m.add(c['arrive'] - 0.55, whoosh(0.55, 500, 4000), 0.5, -0.3)
    m.add(c['arrive'], kick(300, 120, 0.12, 1.0), 0.7)
    m.add(c['flip'], tick(1800, 0.05), 0.4)
    m.add(c['place'], thud(0.6), 0.9)
    m.add(c['arrive'], pad([hz('D3')], 1.0, 0.2, 0.5), 0.3)
    # the rise: a heartbeat that quickens, each set brick a step higher, a riser to the top
    r = b['rise']
    t, bpm = r['from'], 72
    while t < b['summit']['flash'] - 0.1:
        m.add(t, kick(90, 45, 0.3, 0.05), 0.8)
        m.add(t + 60 / bpm * 0.28, kick(80, 42, 0.25, 0.03), 0.5)
        bpm = min(150, bpm * 1.06)
        t += 60 / bpm
    scale = ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'Bb5', 'C6', 'D6', 'E6']
    for k, ta in enumerate(b['riseThrows']):
        m.add(ta - 0.5, whoosh(0.5, 600, 4000), 0.15, -0.4)
        m.add(ta + 0.05, bell(hz(scale[k]), 0.9, 4.0), 0.4, 0.1)
        m.add(ta + 0.05, thud(0.25, 0.5), 0.35)
    dr = b['summit']['flash'] - r['from']
    x = tt(dr)
    m.add(r['from'], band(noise(dr), 500, 9000) * (x / dr) ** 3 * 0.5 + np.sin(2 * np.pi * np.cumsum(110 + 330 * (x / dr) ** 2) / SR) * (x / dr) ** 2 * 0.25, 1.0)
    m.add(r['from'], pad([hz('D3'), hz('F3'), hz('A3')], dr, 1.5, 0.05), 0.4)
    # the summit
    m.add(b['summit']['flash'], impact(), 1.0)
    m.add(b['summit']['flash'], pad([hz('D3'), hz('F#3'), hz('A3'), hz('D4')], b['silent']['stop'] - b['summit']['flash'] + 0.1, 0.02, 0.15), 0.8)
    for k, n in enumerate(['D5', 'F#5', 'A5', 'D6']):
        m.add(b['summit']['flash'] + 0.05 + k * 0.09, bell(hz(n), 1.2, 2.5), 0.35, -0.3 + 0.2 * k)
    # silence: only wind, and the brick slipping from a hand
    s = b['silent']
    m.add(s['stop'], band(noise(1.0), 200, 1200) * env(SR, 0.3, 0.4), 0.12)
    m.add(s['drop'] + 0.27, thud(0.5, 0.7), 0.9, -0.2)
    # the ladder: warm D major, a rattle per rung, the landing, a bell at the signature
    st = b['stairs']
    m.add(st['walk'], pad([hz('D3'), hz('A3'), hz('F#4')], b['duration'] - st['walk'], 0.8, 1.2), 0.55)
    for k, n in enumerate(['D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'G4', 'B4', 'D5', 'G5']):
        m.add(st['text1'] + 0.2 + k * 0.17, bell(hz(n), 1.6, 2.2), 0.3, -0.2 + 0.04 * k)
    rungs = 16
    for k in range(rungs):
        u = (k + 1) / rungs
        m.add(st['unroll'] + (st['land'] - st['unroll']) * u ** 0.6, tick(1200 + 300 * (k % 3), 0.06) + 0.5 * tick(500, 0.06), 0.25, -0.5 + u)
    m.add(st['land'], thud(0.5, 0.6), 0.6, -0.4)
    m.add(st['land'], pad([hz('G3'), hz('B3'), hz('D4'), hz('G4')], 1.0, 0.05, 0.9), 0.5)
    m.add(st['land'] + 0.9, pad([hz('D3'), hz('F#3'), hz('A3'), hz('D4')], b['duration'] - st['land'] - 0.9, 0.3, 0.8), 0.6)
    for k in range(3):
        m.add(st['climb'] + 0.3 + k * 0.45, step(), 0.5, -0.5)
    m.add(st['sign'], bell(hz('D6'), 1.8, 1.6), 0.4)
    m.out('a')


# ——— B ———
def score_b():
    b = json.loads((root / 'src/b/beats.json').read_text(encoding='utf-8'))
    m = Mix(b['duration'])
    beat = 60 / 96 / 2  # eighth notes at 96 bpm
    Y = b['years']
    drone = lambda t0, d, g=0.45: m.add(t0, pad([hz('D2'), hz('A2'), hz('D3')], d, 0.6, 0.8), g)
    drone(0, Y['fade'] + 0.6)
    drone(Y['fade'] + 0.3, b['duration'] - Y['fade'] - 0.3, 0.4)

    def drum(t0, t1, gain=0.6, double=False):
        pat = ['D', '', 'T', '', 'D', 'D', 'T', '']  # maqsum
        step_ = beat / (2 if double else 1)
        k, t = 0, t0
        while t < t1:
            p = pat[k % 8]
            if p == 'D':
                m.add(t, dum(), gain, -0.1)
            elif p == 'T':
                m.add(t, tak(), gain * 0.7, 0.2)
            k += 1
            t += step_

    def oud(t, n, d=1.4, g=0.5, pan=0.15):
        m.add(t, pluck(hz(n), d, 0.35, 0.995), g, pan)

    def phrase(t0, notes, step_=beat, g=0.5):
        for k, n in enumerate(notes):
            if n:
                oud(t0 + k * step_, n, g=g)

    # dig and plant: the drum and an opening Hijaz phrase; shovel, a playful run on the laugh, the bubble pops
    D, P = b['dig'], b['plant']
    drum(0, Y['from'], 0.45)
    phrase(0.0, ['A4', '', 'Bb4', 'A4', 'G4', '', 'F#4', 'G4', 'A4', '', '', '', 'G4', 'F#4', 'Eb4', 'D4'])
    phrase(2.6, ['D4', 'Eb4', 'F#4', '', 'G4', 'F#4', 'Eb4', 'D4'], g=0.4)
    for s in D['strokes']:
        m.add(s, crunch(), 0.7, -0.2)
        m.add(s + 0.15, crunch(0.2), 0.35, 0.3)
    for k, n in enumerate(['D5', 'C5', 'Bb4', 'A4']):
        oud(D['laugh'] + k * 0.07, n, 0.5, 0.35, -0.4)
    m.add(D['ask'], pop(), 0.5, -0.3)
    m.add(P['set'], thud(0.3, 0.4), 0.5)
    for k in range(4):
        m.add(P['pat'] + k * 0.06, step(), 0.4)
    m.add(P['water'], trickle(P['waterEnd'] - P['water'] + 0.1), 0.5, -0.1)
    m.add(P['pet'], pad([hz('D4'), hz('F#4'), hz('A4')], 0.9, 0.1, 0.6), 0.35)
    # years: the drum doubles, a whoosh for each night, a tick for each year on the counter; the drum stops when he is gone
    drum(Y['from'], Y['fade'], 0.5, True)
    span = Y['to'] - Y['from']
    for k in range(Y['days']):
        m.add(Y['from'] + span * (k + 0.5) / Y['days'] - 0.3, whoosh(0.6, 200, 2500), 0.3, -0.6 + 0.24 * k)
    ease = bezier(0.65, 0, 0.35, 1)
    f0, n_frames = round(Y['from'] * 60) + 20, round(Y['to'] * 60) - round(Y['from'] * 60) - 60
    last = 0
    for fr in range(f0, round(Y['to'] * 60)):
        n = max(1, round(1 + 39 * ease(min(1, max(0, (fr - f0) / n_frames)))))
        if n != last:
            m.add(fr / 60, tick(2200 + 15 * n, 0.03), 0.3, 0.2)
            last = n
    phrase(Y['from'], ['D5', '', 'C5', 'Bb4', 'A4', '', 'G4', 'A4'] * 2, beat, 0.35)
    # he is gone: one long trembling note
    for k in range(int(1.4 / 0.06)):
        oud(Y['fade'] + k * 0.06, 'D4', 0.3, 0.22 * (1 - k / 24), 0)
    oud(Y['fade'] + 1.5, 'A3', 2.0, 0.35)
    # shade: a slow phrase; the dates; the text
    Sh = b['shade']
    phrase(Y['to'] + 0.2, ['G4', '', '', 'F#4', 'Eb4', '', 'D4', '', '', '', 'A4', '', 'G4', 'F#4', 'G4', ''], beat * 1.4, 0.4)
    for t in (Sh['date1'], Sh['date2']):
        m.add(t + 0.25, tick(900, 0.05), 0.25)
    m.add(Sh['text'], pad([hz('D4'), hz('F#4'), hz('A4')], 1.6, 0.2, 1.0), 0.3)
    # again: the drum comes back; cane, footsteps, digging, the offshoot set
    A = b['again']
    drum(A['stand'], b['duration'] - 0.6, 0.4)
    m.add(A['cane'], tick(600, 0.06), 0.4)
    k, t = 0, A['walk']
    while t < A['walkEnd']:
        m.add(t, step(), 0.5, -0.2 + 0.1 * k)
        k += 1
        t += 0.16
    for s in A['scoop']:
        m.add(s, crunch(0.2), 0.5, 0.2)
    m.add(A['set'], thud(0.3, 0.4), 0.5)
    phrase(A['stand'], ['A4', '', 'Bb4', 'A4', 'G4', '', 'F#4', 'G4', 'A4', '', '', ''], beat, 0.4)
    # ask: the same question, the hand on her head, and the cadence home to D
    K = b['ask']
    for k in range(3):
        m.add(K['girl'] + k * 0.16, step(), 0.3, 0.5)
    m.add(K['askText'], pop(), 0.5, 0.3)
    m.add(K['pat'], pad([hz('D4'), hz('F#4'), hz('A4')], 1.2, 0.1, 0.8), 0.35)
    phrase(K['text'] - 0.3, ['G4', 'F#4', 'Eb4', 'D4'], beat * 1.2, 0.55)
    m.add(K['text'] + 0.5, dum(), 0.7)
    oud(K['text'] + 0.5, 'D3', 2.4, 0.5)
    m.add(K['sign'], bell(hz('D5'), 1.6, 1.8), 0.3)
    m.out('b', 0.28)


if __name__ == '__main__':
    score_a()
    score_b()
