"""Sound synthesis shared by the films and ads: effects (SFX), a soft piano, a stereo bus and the loudness master.
Nothing is sampled: every sound is made here. Import it from another project with sys.path.
"""
import re
import subprocess
import wave

import numpy as np

SR = 48000
rng = np.random.default_rng(4)

def tt(d): return np.arange(int(d * SR)) / SR


def env(n, a, r):
    e = np.ones(n)
    a = max(1, int(a * SR)); e[:a] = np.linspace(0, 1, a)
    r = min(n, max(1, int(r * SR))); e[-r:] *= np.linspace(1, 0, r) ** 2
    return e


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * (1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)), len(x))


def noise(d): return rng.standard_normal(int(d * SR))


def piano(f, d=3.0, vel=1.0):
    x = tt(d)
    y = sum(a * np.sin(2 * np.pi * f * m * x * (1 + 0.0004 * m * m)) * np.exp(-x * (1.6 + 1.1 * m)) for m, a in [(1, 1), (2, 0.42), (3, 0.18), (4, 0.08), (5, 0.04)])
    hammer = band(noise(0.02), 1500, 6000) * np.exp(-tt(0.02) * 250) * 0.15
    y[:len(hammer)] += hammer
    return y * env(len(x), 0.006, 0.4) * vel


def hz(n):
    m = re.match(r'([A-G])(#|b)?(\d)', n)
    k = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}[m[1]] + {'#': 1, 'b': -1, None: 0}[m[2]] + 12 * (int(m[3]) + 1)
    return 440 * 2 ** ((k - 69) / 12)


def thud(d=0.4, f0=90, f1=45):
    x = tt(d)
    return np.sin(2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-x * 25)) / SR) * np.exp(-x * 10) + 0.4 * band(noise(d), 80, 900) * np.exp(-x * 25)


def click(f=2400, d=0.025): x = tt(d); return np.sin(2 * np.pi * f * x) * np.exp(-x * 220)


def layer(base, *rest):
    """Sum signals, each (offset seconds, signal) after the base."""
    n = max([len(base)] + [int(o * SR) + len(x) for o, x in rest])
    y = np.zeros(n); y[:len(base)] += base
    for o, x in rest:
        s = int(o * SR); y[s:s + len(x)] += x
    return y


SFX = {
    'buzz': lambda: np.concatenate([np.sin(2 * np.pi * 160 * tt(0.28)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 26 * tt(0.28)))) * env(int(0.28 * SR), 0.01, 0.05), np.zeros(int(0.12 * SR))] * 2) * 0.6,
    'ding': lambda: layer(piano(hz('E6'), 1.2, 0.8), (0.0, piano(hz('B6'), 1.0, 0.4))),
    'door': lambda: layer(thud(0.5, 110, 50) * 1.2, (0.03, click(1800, 0.04))),
    'latch': lambda: layer(click(1700, 0.05), (0.05, click(2600, 0.03) * 0.6)),
    'knock': lambda: np.concatenate([np.concatenate([thud(0.12, 220, 120) * 0.9, np.zeros(int(0.14 * SR))]) for _ in range(3)]),
    'tap': lambda: thud(0.12, 260, 140) * 0.6,
    'bang': lambda: layer(thud(0.6, 120, 40) * 1.4, (0.0, band(noise(0.5), 2000, 7000) * np.exp(-tt(0.5) * 9) * 0.5)),
    'type': lambda: np.concatenate([np.concatenate([click(3000 + 600 * rng.random(), 0.02) * (0.5 + 0.5 * rng.random()), np.zeros(int((0.05 + 0.07 * rng.random()) * SR))]) for _ in range(14)]),
    'erase': lambda: np.concatenate([np.concatenate([click(2200, 0.02) * 0.6, np.zeros(int(0.045 * SR))]) for _ in range(18)]),
    'pen': lambda: band(noise(1.2), 2500, 7000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.2 * tt(1.2)))) * env(int(1.2 * SR), 0.05, 0.2) * 0.25,
    'page': lambda: band(noise(0.35), 1200, 6000) * np.sin(np.linspace(0, np.pi, int(0.35 * SR))) * 0.5,
    'whoosh': lambda: band(noise(0.5), 400, 3500) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) ** 2 * 0.5,
    'rewind': lambda: band(noise(0.6), 600, 5000) * np.linspace(0, 1, int(0.6 * SR)) ** 2 * 0.5,
    'pop': lambda: np.sin(2 * np.pi * np.cumsum(500 + 600 * tt(0.08) / 0.08) / SR) * np.exp(-tt(0.08) * 40) * 0.6,
    'stamp': lambda: layer(thud(0.25, 160, 70), (0.0, click(1500, 0.04) * 0.6)),
    'boil': lambda: layer(band(noise(3), 100, 1200) * 0.08, *[(t, np.sin(2 * np.pi * (300 + 500 * rng.random()) * tt(0.05)) * np.exp(-tt(0.05) * 60) * 0.25) for t in rng.uniform(0, 2.9, 40)]),
    'wind': lambda: band(noise(3), 200, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.4 * tt(3))) * env(int(3 * SR), 0.6, 1.0) * 0.5,
    'water': lambda: band(noise(4), 150, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt(4))) * env(int(4 * SR), 1.0, 1.5) * 0.3,
    'wave': lambda: band(noise(4), 120, 2200) * np.sin(np.linspace(0, np.pi, int(4 * SR))) ** 1.5 * 0.6,
    'breath_in': lambda: band(noise(1.6), 500, 3000) * np.sin(np.linspace(0, np.pi, int(1.6 * SR))) ** 2 * 0.22,
    'breath_out': lambda: band(noise(2.2), 300, 2000) * np.sin(np.linspace(0, np.pi, int(2.2 * SR))) ** 2 * 0.22,
    'heart': lambda: np.concatenate([np.concatenate([thud(0.18, 70, 45), np.zeros(int(0.12 * SR)), thud(0.16, 65, 45) * 0.7, np.zeros(int(0.3 * SR))]) for _ in range(3)]) * 0.9,
    'steps': lambda: np.concatenate([np.concatenate([band(noise(0.09), 100, 1200) * np.exp(-tt(0.09) * 40), np.zeros(int(0.38 * SR))]) for _ in range(6)]) * 0.6,
    'chair': lambda: layer(band(noise(0.5), 300, 1500) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.4, (0.0, thud(0.2, 100, 60) * 0.4)),
    'chime': lambda: layer(piano(hz('D6'), 1.6, 0.5), (0.09, piano(hz('F#6'), 1.6, 0.4)), (0.18, piano(hz('A6'), 1.6, 0.3))),
    'click': lambda: click(2000, 0.03),
    'swish': lambda: band(noise(0.25), 1000, 6000) * np.sin(np.linspace(0, np.pi, int(0.25 * SR))) ** 2 * 0.5,
    'rumble': lambda: band(noise(2.5), 30, 200) * np.exp(-tt(2.5) * 1.2) * 1.0,
    'laugh': lambda: np.concatenate([np.concatenate([band(noise(0.11), 400, 2200) * np.sin(np.linspace(0, np.pi, int(0.11 * SR))) * 0.5, np.zeros(int(0.07 * SR))]) for _ in range(5)]),
}


class Bus:
    def __init__(self, d):
        self.L = np.zeros(int((d + 4) * SR)); self.R = np.zeros_like(self.L)

    def add(self, t, sig, gain=1.0, pan=0.0):
        s = int(round(t * SR))
        if s < 0 or s >= len(self.L): return
        sig = np.asarray(sig, dtype=float)[:len(self.L) - s] * gain
        self.L[s:s + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
        self.R[s:s + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


def read_mono(p):
    w = wave.open(str(p)); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float64) / 32768
    if w.getnchannels() == 2: x = x.reshape(-1, 2).mean(1)
    assert w.getframerate() == SR
    return x


def loud(p):
    """Integrated loudness (LUFS) and true peak (dBTP) of a file, measured by ffmpeg's EBU R128 filter."""
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(p), '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', o)[-1])


def write_stereo(path, L, R):
    st = np.stack([L, R], 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(st, -1, 1) * 32767).astype('<i2').tobytes())


def master(raw, out, lufs=-16.0, peak=-2.0):
    """Gain to the target loudness with a true-peak limiter (4x oversampled); repeats until within 0.2 LU."""
    gain = round(lufs - loud(raw)[0], 2)
    lim = 10 ** (peak / 20)
    for _ in range(4):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', f'volume={gain}dB,aresample=192000,alimiter=limit={lim:.4f}:level=false:attack=1:release=80,aresample=48000', '-ar', '48000', '-ac', '2', str(out)], check=True)
        got, tp = loud(out)
        if abs(got - lufs) < 0.2: break
        gain = round(gain + lufs - got, 2)
    return got, tp

