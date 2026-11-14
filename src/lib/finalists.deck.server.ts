import { deckExtension, MAX_DECK_BYTES } from "./finalists.validation.ts";
import { inflateRawSync } from "node:zlib";
// Check content, not browser MIME. ZIP entries are bounded before decompression.
export function validateDeck(bytes: Buffer, name: string, expectedSize: number) {
  if (!bytes.length || bytes.length > MAX_DECK_BYTES || bytes.length !== expectedSize)
    throw new Error(
      "Presentation size does not match the authorized upload (maximum 5,000,000 bytes).",
    );
  const ext = deckExtension(name);
  if (ext === "pdf") {
    if (
      bytes.subarray(0, 5).toString() !== "%PDF-" ||
      !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))
    )
      throw new Error("The file is not a PDF presentation.");
  } else if (ext === "ppt") {
    if (
      !bytes.subarray(0, 8).equals(Buffer.from("d0cf11e0a1b11ae1", "hex")) ||
      !bytes.includes(Buffer.from("PowerPoint Document", "utf16le"))
    )
      throw new Error("The file is not a PowerPoint presentation.");
  } else {
    let end = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
      if (bytes.readUInt32LE(i) === 0x06054b50) {
        end = i;
        break;
      }
    if (end < 0) throw new Error("The file is not a PPTX presentation.");
    const count = bytes.readUInt16LE(end + 10);
    let offset = bytes.readUInt32LE(end + 16);
    const names = new Set<string>();
    let contentTypes = "";
    if (count > 4096) throw new Error("Presentation archive has too many entries.");
    for (let n = 0; n < count; n++) {
      if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50)
        throw new Error("Invalid PPTX directory.");
      const size = bytes.readUInt32LE(offset + 20),
        expanded = bytes.readUInt32LE(offset + 24),
        method = bytes.readUInt16LE(offset + 10);
      const length = bytes.readUInt16LE(offset + 28),
        extra = bytes.readUInt16LE(offset + 30),
        comment = bytes.readUInt16LE(offset + 32);
      const filename = bytes.subarray(offset + 46, offset + 46 + length).toString();
      names.add(filename);
      if (filename === "[Content_Types].xml") {
        const local = bytes.readUInt32LE(offset + 42);
        if (
          local + 30 > bytes.length ||
          bytes.readUInt32LE(local) !== 0x04034b50 ||
          expanded > 262144
        )
          throw new Error("Invalid PPTX content types.");
        const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
        if (start + size > bytes.length) throw new Error("Invalid PPTX contents.");
        const data = bytes.subarray(start, start + size);
        contentTypes = (
          method === 0
            ? data
            : method === 8
              ? inflateRawSync(data, { maxOutputLength: 262144 })
              : Buffer.alloc(0)
        ).toString();
      }
      offset += 46 + length + extra + comment;
    }
    if (
      !names.has("ppt/presentation.xml") ||
      !names.has("_rels/.rels") ||
      !contentTypes.includes(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
      )
    )
      throw new Error("The archive is not a PPTX presentation.");
  }
}
