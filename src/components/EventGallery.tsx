export type EventGalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  media_url: string;
  media_type: "image" | "video" | "poster" | string;
};

export function EventGallery({ items }: { items: EventGalleryItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-8 border-t border-hairline pt-6">
      <div className="mx-auto max-w-6xl px-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-silver">
          Event gallery
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <figure key={item.id} className="overflow-hidden border border-hairline bg-card/40">
              <div className="aspect-[4/3] bg-secondary">
                {item.media_type === "video" ? (
                  <video
                    src={item.media_url}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <figcaption className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm">{item.title}</span>
                  {item.media_type === "poster" && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-silver">
                      Poster
                    </span>
                  )}
                </div>
                {item.caption && (
                  <p className="mt-1 text-xs text-muted-foreground">{item.caption}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
