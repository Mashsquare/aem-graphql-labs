/** Provided UI for Lab 07 — you don't need to edit this file. */
import { Badge, CardGrid, EmptyState, MediaCard, Panel, QueryPeek, formatPrice } from "@/components/lab-ui";
import type { AdventureCard, AdventureDetail } from "./types";

export interface FirstQueryApi {
  endpoint: () => string;
  getAdventureCards: () => Promise<AdventureCard[]>;
  getAdventureByPath: (path: string) => Promise<AdventureDetail | null>;
  toPublishUrl: (dynamicUrl: string) => string;
  cardsQuery: string;
  byPathQuery: string;
}

export async function FirstQueryView({ api, selectedPath }: { api: FirstQueryApi; selectedPath?: string }) {
  const endpoint = api.endpoint();
  const [cards, detail] = await Promise.all([
    api.getAdventureCards(),
    selectedPath ? api.getAdventureByPath(selectedPath) : Promise.resolve(undefined),
  ]);
  const image = (card: AdventureCard, width: number) => {
    if (!card.primaryImage?._dynamicUrl) return null;
    const url = new URL(api.toPublishUrl(card.primaryImage._dynamicUrl));
    url.searchParams.set("width", String(width));
    return url.toString();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 font-mono text-xs break-all">POST {endpoint}</div>

      {selectedPath ? (
        <Panel title={detail?.title ?? "Not found"} description={<code className="text-xs">{selectedPath}</code>}>
          {detail ? (
            <div className="grid gap-5 md:grid-cols-[2fr_3fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {image(detail, 800) ? <img src={image(detail, 800)!} alt="" className="w-full rounded-lg" /> : null}
              <div className="space-y-3 text-sm">
                <p className="flex flex-wrap gap-2">
                  <Badge tone="accent">{detail.activity}</Badge>
                  <Badge>{detail.difficulty}</Badge>
                  <Badge>group of {detail.groupSize}</Badge>
                  <Badge>{detail.tripLength}</Badge>
                </p>
                <p className="text-lg font-medium">{formatPrice(detail.price)}</p>
                <p className="whitespace-pre-line">{detail.description?.plaintext}</p>
                <p className="text-muted">
                  📍 {detail.location ? `${detail.location.name}, ${detail.location.city}, ${detail.location.country}` : "no location"}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState>
              <code>adventureByPath</code> returned <code>item: null</code> — no published adventure at that path.
            </EmptyState>
          )}
          <QueryPeek label="Your ADVENTURE_BY_PATH_QUERY" query={api.byPathQuery} />
        </Panel>
      ) : null}

      <Panel title="Adventures" description={`${cards.length} items from adventureList`}>
        <CardGrid>
          {cards.map((card) => (
            <MediaCard
              key={card._path}
              href={`?path=${encodeURIComponent(card._path)}`}
              title={card.title}
              imageUrl={image(card, 600)}
              badge={card.activity ? <Badge tone="accent">{card.activity}</Badge> : null}
              meta={[formatPrice(card.price), card.tripLength]}
            />
          ))}
        </CardGrid>
        <QueryPeek label="Your ADVENTURE_CARDS_QUERY" query={api.cardsQuery} />
      </Panel>
    </div>
  );
}
