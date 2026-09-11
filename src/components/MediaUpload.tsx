import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { uploadAnnouncementMedia } from "@/lib/admin.functions";

export type UploadedMediaType = "image" | "video";

export function MediaUpload({
  value,
  mediaType,
  onChange,
}: {
  value: string | null;
  mediaType: UploadedMediaType | null;
  onChange: (url: string | null, type: UploadedMediaType | null) => void;
}) {
  const upload = useServerFn(uploadAnnouncementMedia);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Choose an image or video file.");
      return;
    }
    if (file.size > 24 * 1024 * 1024) {
      toast.error("Keep media under 24 MB.");
      return;
    }

    setBusy(true);
    try {
      const type: UploadedMediaType = file.type.startsWith("video/") ? "video" : "image";
      const ext = file.name.split(".").pop()?.toLowerCase() || (type === "video" ? "mp4" : "jpg");
      const body = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < body.length; i += 0x8000) {
        binary += String.fromCharCode(...body.subarray(i, i + 0x8000));
      }
      const { url } = await upload({
        data: { ext, contentType: file.type, base64: btoa(binary) },
      });
      onChange(url, type);
      toast.success(`${type === "video" ? "Video" : "Image"} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed. Try a smaller file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-3 border-t border-hairline pt-5 md:col-span-2">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Announcement media
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Optional. Admins can attach one image or video, up to 24 MB.
        </p>
      </div>
      {value && mediaType === "video" && (
        <video
          src={value}
          controls
          className="max-h-72 w-full border border-hairline bg-secondary"
        />
      )}
      {value && mediaType === "image" && (
        <img
          src={value}
          alt="Announcement preview"
          className="max-h-72 w-full border border-hairline bg-secondary object-contain"
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="border border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:border-silver disabled:opacity-50"
        >
          {busy ? "Uploading…" : value ? "Replace media" : "Upload image or video"}
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
        accept="image/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void pick(file);
        }}
      />
    </div>
  );
}
