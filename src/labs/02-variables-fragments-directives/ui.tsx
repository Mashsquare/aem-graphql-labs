/**
 * Provided UI for Lab 02 — you don't need to edit this file.
 */
import Link from "next/link";
import { Badge, CardGrid, EmptyState, Field, JsonPeek, MediaCard, Panel, QueryPeek, buttonClass, inputClass } from "@/components/lab-ui";
import type { CharacterCard, CharacterPairData, CharactersData, CharactersVariables } from "./types";

export interface CharactersApi {
  searchCharacters: (variables: CharactersVariables) => Promise<CharactersData>;
  getPair: (a: string, b: string) => Promise<CharacterPairData>;
  charactersQuery: string;
  pairQuery: string;
}

const statusTone = (status: CharacterCard["status"]) => (status === "Alive" ? "ok" : status === "Dead" ? "danger" : "neutral");

function pageHref(params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams(Object.entries({ ...params, page: String(page) }).filter(([, value]) => value) as [string, string][]);
  return `?${search.toString()}`;
}

export async function CharactersView({
  api,
  params,
}: {
  api: CharactersApi;
  params: { name?: string; status?: string; page?: string; episodes?: string; a?: string; b?: string };
}) {
  const variables: CharactersVariables = {
    page: Number(params.page ?? 1) || 1,
    name: params.name || undefined,
    status: params.status || undefined,
    withEpisodes: params.episodes === "on",
  };
  const [result, pair] = await Promise.all([api.searchCharacters(variables), api.getPair(params.a ?? "1", params.b ?? "2")]);
  const info = result.characters?.info;
  const results = result.characters?.results ?? [];

  return (
    <div className="space-y-6">
      <Panel title="Characters" description={info?.count ? `${info.count} matches · page ${variables.page} of ${info.pages}` : "No matches"}>
        <form className="mb-5 flex flex-wrap items-end gap-3">
          <Field label="Name">
            <input name="name" defaultValue={params.name} placeholder="rick" className={inputClass} />
          </Field>
          <Field label="Status">
            <select name="status" defaultValue={params.status ?? ""} className={inputClass}>
              <option value="">any</option>
              <option value="alive">alive</option>
              <option value="dead">dead</option>
              <option value="unknown">unknown</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" name="episodes" defaultChecked={variables.withEpisodes} /> include episodes (@include)
          </label>
          <input type="hidden" name="a" value={params.a ?? "1"} />
          <input type="hidden" name="b" value={params.b ?? "2"} />
          <button className={buttonClass}>Search</button>
        </form>

        {results.length ? (
          <CardGrid>
            {results.map((character) => (
              <MediaCard
                key={character.id}
                title={character.name}
                imageUrl={character.image}
                badge={<Badge tone={statusTone(character.status)}>{character.status}</Badge>}
                meta={[character.species, character.location?.name]}
                footer={
                  character.episode ? (
                    <p className="text-xs text-muted">
                      {character.episode.length} episodes, first: {character.episode[0]?.episode}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">episodes not requested</p>
                  )
                }
              />
            ))}
          </CardGrid>
        ) : (
          <EmptyState>No characters for these filters.</EmptyState>
        )}

        <div className="mt-4 flex items-center gap-2">
          {info?.prev ? (
            <Link className={buttonClass} href={pageHref(params, info.prev)}>
              ← Page {info.prev}
            </Link>
          ) : null}
          {info?.next ? (
            <Link className={buttonClass} href={pageHref(params, info.next)}>
              Page {info.next} →
            </Link>
          ) : null}
        </div>
        <QueryPeek label="Your CHARACTERS_QUERY" query={api.charactersQuery} />
        <JsonPeek label="Variables sent" data={variables} />
        <JsonPeek label="Raw JSON (first result)" data={results[0] ?? null} />
      </Panel>

      <Panel title="Compare two characters" description="One request, the same field twice — thanks to aliases.">
        <form className="mb-4 flex flex-wrap items-end gap-3">
          <Field label="First id">
            <input name="a" defaultValue={params.a ?? "1"} className={`${inputClass} w-24`} />
          </Field>
          <Field label="Second id">
            <input name="b" defaultValue={params.b ?? "2"} className={`${inputClass} w-24`} />
          </Field>
          <button className={buttonClass}>Compare</button>
        </form>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["first", "second"] as const).map((alias) => {
            const character = pair[alias];
            return character ? (
              <MediaCard key={alias} title={`${alias}: ${character.name}`} imageUrl={character.image} meta={[character.species, character.origin?.name]} />
            ) : (
              <EmptyState key={alias}>{alias}: null (no character with that id)</EmptyState>
            );
          })}
        </div>
        <QueryPeek label="Your CHARACTER_PAIR_QUERY" query={api.pairQuery} />
      </Panel>
    </div>
  );
}
