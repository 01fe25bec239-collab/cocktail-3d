// Magic-byte signatures for upload hardening (ADMIN-008).
// The browser's File.type comes from the filename/OS, not the bytes — a
// malicious or mislabeled file can claim to be image/png. Sniffing the first
// bytes catches the obvious mismatches client-side. NOTE: this is UX-grade
// hardening only; the media bucket currently has no server-side MIME/size
// enforcement (see report — production Storage mutation was out of scope).

export type FileKind = 'image' | 'video';

interface Signature {
  kind: FileKind;
  bytes: number[];
  offset: number;
  label: string;
}

const SIGNATURES: Signature[] = [
  { kind: 'image', bytes: [0xff, 0xd8, 0xff], offset: 0, label: 'jpeg' },
  { kind: 'image', bytes: [0x89, 0x50, 0x4e, 0x47], offset: 0, label: 'png' },
  { kind: 'image', bytes: [0x47, 0x49, 0x46, 0x38], offset: 0, label: 'gif' },
  { kind: 'image', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, label: 'webp' }, // RIFF....WEBP
  { kind: 'image', bytes: [0x42, 0x4d], offset: 0, label: 'bmp' },
  { kind: 'video', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4, label: 'mp4/mov' }, // ....ftyp
  { kind: 'video', bytes: [0x1a, 0x45, 0xdf, 0xa3], offset: 0, label: 'webm/mkv' },
];

/** Pure matcher over header bytes so it is unit-testable without File I/O. */
export function matchFileKind(header: Uint8Array): { kind: FileKind; label: string } | null {
  for (const sig of SIGNATURES) {
    if (header.length < sig.offset + sig.bytes.length) continue;
    const ok = sig.bytes.every((b, i) => header[sig.offset + i] === b);
    // WEBP needs the trailing WEBP marker at +8 to distinguish from other RIFF.
    if (ok && sig.label === 'webp') {
      if (
        header.length >= 12 &&
        header[8] === 0x57 && header[9] === 0x45 &&
        header[10] === 0x42 && header[11] === 0x50
      ) {
        return { kind: sig.kind, label: sig.label };
      }
      continue;
    }
    if (ok) return { kind: sig.kind, label: sig.label };
  }
  return null;
}

export const MAGIC_HEADER_LENGTH = 16;

/** Reads just the file header and verifies it plausibly matches `kind`. */
export async function sniffFileKind(file: File): Promise<FileKind | null> {
  try {
    const slice = file.slice(0, Math.max(MAGIC_HEADER_LENGTH, 12));
    const buffer = await slice.arrayBuffer();
    return matchFileKind(new Uint8Array(buffer))?.kind ?? null;
  } catch {
    return null;
  }
}
