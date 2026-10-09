"""Original instrumental bed for the reel (no samples, no third-party material): a soft pad and a
mallet-like pluck pattern (Karplus–Strong) over C–G–Am–F at 96 BPM, with a light synthetic room.
usage: python3 tools/music.py SECONDS OUT.wav     (seeded: the same file every time)
It starts at full (low) level from the first frame — no silent intro — and fades only at the end."""
import sys, wave
import numpy as np

sr, dur, out = 48000, float(sys.argv[1]), sys.argv[2]
rng = np.random.default_rng(11)
n = int(sr * dur)
mix = np.zeros(n)
beat = 60 / 96
bar = 4 * beat
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]]   # C G Am F
t_all = np.arange(n) / sr

# pad: two bars per chord, slow attack/release, slightly detuned sines
for k in range(int(dur / (2 * bar)) + 1):
    c = chords[k % 4]
    a, b = int(k * 2 * bar * sr), min(n, int((k + 1) * 2 * bar * sr + 0.6 * sr))
    if a >= n:
        break
    t = np.arange(b - a) / sr
    env = np.minimum(1, t / 0.8) * np.minimum(1, (b - a - np.arange(b - a)) / sr / 0.8)
    for m in c:
        for det in (-0.08, 0.08):
            mix[a:b] += 0.05 * env * np.sin(2 * np.pi * hz(m + 12 + det) * t)

# plucks: eighth notes from the chord's pentatonic, sparse and soft
def pluck(f, length):
    p = int(sr / f)
    buf = rng.uniform(-1, 1, p)
    y = np.zeros(length)
    for i in range(length):
        y[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return y

pent = {0: [64, 67, 72, 76], 1: [67, 71, 74, 79], 2: [69, 72, 76, 79], 3: [65, 69, 72, 77]}
cache = {}
step = beat / 2
for i in range(int(dur / step)):
    if rng.random() < 0.38:
        continue
    k = int(i * step / (2 * bar)) % 4
    m = pent[k][rng.integers(0, 4)]
    if m not in cache:
        cache[m] = pluck(hz(m), int(1.2 * sr))
    a = int(i * step * sr)
    seg = cache[m][: max(0, min(len(cache[m]), n - a))]
    mix[a:a + len(seg)] += 0.16 * seg * (0.7 + 0.3 * rng.random())

# a light room: a few feedback delays, low-passed
room = np.zeros(n)
for d, g in ((0.031, 0.35), (0.047, 0.3), (0.071, 0.25), (0.113, 0.2)):
    s = int(d * sr)
    room[s:] += g * mix[:-s]
mix = mix + 0.5 * room
k = 9
mix = np.convolve(mix, np.ones(k) / k, mode='same')        # soften the top end
fade = int(1.8 * sr)
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.5
st = np.stack([mix, np.roll(mix, int(0.012 * sr))], axis=1)  # a touch of width
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print(out, round(dur, 2), 's')
