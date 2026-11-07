"""Rearranges an MP4 without touching its frames: drops the sound track and moves the index (moov) to the front.
Same result as `ffmpeg -c:v copy -an -movflags +faststart`, for a file with one video and one sound track."""
import struct, sys

CONTAINERS = {b'moov', b'trak', b'mdia', b'minf', b'stbl', b'edts', b'dinf', b'udta'}

def boxes(data, start, end):
    i = start
    while i < end:
        size, kind = struct.unpack('>I4s', data[i:i + 8])
        head = 8
        if size == 1:
            size = struct.unpack('>Q', data[i + 8:i + 16])[0]
            head = 16
        elif size == 0:
            size = end - i
        yield kind, i, head, size
        i += size

def handler(trak):
    at = trak.find(b'hdlr')
    return trak[at + 12:at + 16]

def shift_offsets(box, delta):
    """Returns the box with every stco/co64 chunk offset moved by delta."""
    out = bytearray(box)
    def walk(start, end):
        for kind, at, head, size in boxes(out, start, end):
            if kind in CONTAINERS:
                walk(at + head, at + size)
            elif kind == b'stco':
                count = struct.unpack('>I', out[at + 12:at + 16])[0]
                for n in range(count):
                    p = at + 16 + 4 * n
                    out[p:p + 4] = struct.pack('>I', struct.unpack('>I', out[p:p + 4])[0] + delta)
            elif kind == b'co64':
                count = struct.unpack('>I', out[at + 12:at + 16])[0]
                for n in range(count):
                    p = at + 16 + 8 * n
                    out[p:p + 8] = struct.pack('>Q', struct.unpack('>Q', out[p:p + 8])[0] + delta)
    walk(8, len(out))
    return bytes(out)

src, dst = sys.argv[1], sys.argv[2]
data = open(src, 'rb').read()
top = {kind: (at, head, size) for kind, at, head, size in boxes(data, 0, len(data))}
ftyp_at, _, ftyp_size = top[b'ftyp']
moov_at, moov_head, moov_size = top[b'moov']
mdat_at, _, mdat_size = top[b'mdat']
assert moov_at > mdat_at, 'index already at the front'
moov = data[moov_at:moov_at + moov_size]
kept = [moov[at:at + size] for kind, at, head, size in boxes(moov, moov_head, moov_size)
        if not (kind == b'trak' and handler(moov[at:at + size]) == b'soun')]
dropped = sum(1 for kind, at, head, size in boxes(moov, moov_head, moov_size) if kind == b'trak') - sum(1 for b in kept if b[4:8] == b'trak')
assert dropped == 1, f'expected to drop one sound track, dropped {dropped}'
body = b''.join(kept)
new_moov = struct.pack('>I4s', 8 + len(body), b'moov') + body
ftyp = data[ftyp_at:ftyp_at + ftyp_size]
new_mdat_at = len(ftyp) + len(new_moov)
new_moov = shift_offsets(new_moov, new_mdat_at - mdat_at)
open(dst, 'wb').write(ftyp + new_moov + data[mdat_at:mdat_at + mdat_size])
print('dropped sound track; index moved from', moov_at, 'to', len(ftyp), '; size', len(ftyp + new_moov) + mdat_size)
