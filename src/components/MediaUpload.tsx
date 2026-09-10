import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { uploadMedia } from "@/lib/admin.functions";

export type UploadedMediaType = "image" | "video";

export function MediaUpload({
  value,
  mediaType,
  onChange,
  folder = "media",
  label = "Media",
  accept = "image/*,video/*",
}: {
  value: string | null;
  mediaType: UploadedMediaType | null;
  onChange: (url: string | null, type: UploadedMediaType | null) => void;
  folder?: string;
  label?: string;
  accept?: string;
}) {
  const upload = useServerFn(uploadMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (file.size > 24 * 1024 * 1024) {
      toast.error("Keep media under 24 MB.");
      return;
    }
    setBusy(true);
    try {
      const type: UploadedMediaType = file.type.startsWith("video/") ? "video" : "image";
      const ext =
        file.type === "image/png"
          ? "png"
          : file.type === "image/webp"
            ? "webp"
            : file.type === "image/gif"
              ? "gif"
              : file.type === "video/webm"
                ? "webm"
                : file.type === "video/quicktime"
                  ? "mov"
                  : file.type === "video/x-m4v"
                    ? "m4v"
                    : type === "video"
                      ? "mp4"
                      : "jpg";
      const body = new Uint8Array(await file.arrayBuffer());
      let bin = "";
      for (let i = 0; i < body.length; i += 0x8000) {
        bin += String.fromCharCode(...body.subarray(i, i + 0x8000));
      }
      const { url } = await upload({
        data: { folder, ext, contentType: file.type || `${type}/jpeg`, base64: btoa(bin) },
      });
      onChange(url, type);
      toast.success(`${type === "video" ? "Video" : "Media"} uploaded.`);
    } catch {
      toast.error("Upload failed. Try a smaller file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="h-24 w-32 shrink-0 overflow-hidden border border-hairline bg-secondary">
        {value && mediaType === "video" ? (
          <video src={value} controls className="h-full w-full object-cover" />
        ) : value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            None
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-silver disabled:opacity-50"
          >
            {busy ? "Uploading…" : value ? "Replace" : "Upload"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null, null)}
              className="border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:border-silver"
            >
              Clear
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void pick(file);
          }}
        />
      </div>
    </div>
  );
}
