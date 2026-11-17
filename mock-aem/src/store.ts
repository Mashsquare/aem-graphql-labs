import fs from "node:fs";
import path from "node:path";
import type {
  Asset,
  CacheControlConfig,
  ContentFragment,
  FragmentContent,
  FragmentData,
  PersistedQuery,
  SurrogateControlConfig,
  Tier,
} from "./types";
import { assetRegistry } from "./content/helpers";
import { adventures } from "./content/adventures";
import { articles } from "./content/articles";
import { authors } from "./content/authors";
import { locations } from "./content/locations";
import { seedPersistedQueries } from "./content/persisted-queries";

export type AemEvent =
  | { type: "aem.sites.contentFragment.published" | "aem.sites.contentFragment.unpublished" | "aem.sites.contentFragment.modified"; fragment: ContentFragment; user: string }
  | { type: "aem.graphql.persistedQuery.published" | "aem.graphql.persistedQuery.unpublished"; query: PersistedQuery; user: string };

interface PersistedState {
  version: 1;
  fragments: Record<
    string,
    Pick<ContentFragment, "content" | "published" | "lastModified" | "lastModifiedBy">
  >;
  persistedQueries: Record<string, PersistedQuery>;
  deletedPersistedQueries: string[];
}

export class ReplicationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const persistedQueryRepositoryPath = (configurationName: string, name: string) =>
  `/conf/${configurationName}/settings/graphql/persistentQueries/${name}`;

/**
 * In-memory "JCR": fragments, assets and persisted queries, shared by the Author and Publish
 * servers. Author reads `fragment.content`, Publish reads `fragment.published.content`.
 */
export class MockAemStore {
  readonly fragments = new Map<string, ContentFragment>();
  readonly assets = new Map<string, Asset>();
  readonly assetsById = new Map<string, Asset>();
  readonly persistedQueries = new Map<string, PersistedQuery>();
  private readonly listeners = new Set<(event: AemEvent) => void>();
  private state: PersistedState = { version: 1, fragments: {}, persistedQueries: {}, deletedPersistedQueries: [] };

  constructor(private readonly stateFile: string | null) {
    for (const fragment of [...adventures, ...locations, ...authors, ...articles]) {
      this.fragments.set(fragment.path, structuredClone(fragment));
    }
    for (const asset of assetRegistry.values()) {
      this.assets.set(asset.path, asset);
      this.assetsById.set(asset.id, asset);
    }
    for (const query of seedPersistedQueries) {
      this.persistedQueries.set(`${query.configurationName}/${query.name}`, structuredClone(query));
    }
    this.loadState();
  }

  /* ------------------------------------------------------------------------ */
  /* Reads                                                                     */
  /* ------------------------------------------------------------------------ */

  fragmentsOfModel(model: string): ContentFragment[] {
    return [...this.fragments.values()].filter((fragment) => fragment.model === model);
  }

  /** The content a tier is allowed to see, or null when the fragment does not exist there. */
  contentFor(fragment: ContentFragment, tier: Tier): FragmentContent | null {
    return tier === "author" ? fragment.content : (fragment.published?.content ?? null);
  }

  persistedQuery(configurationName: string, name: string): PersistedQuery | undefined {
    return this.persistedQueries.get(`${configurationName}/${name}`);
  }

  /* ------------------------------------------------------------------------ */
  /* Writes                                                                    */
  /* ------------------------------------------------------------------------ */

  onEvent(listener: (event: AemEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  savePersistedQuery(
    mode: "create" | "update",
    input: {
      configurationName: string;
      name: string;
      query: string;
      cacheControl?: CacheControlConfig;
      surrogateControl?: SurrogateControlConfig;
    },
  ): PersistedQuery {
    const key = `${input.configurationName}/${input.name}`;
    const existing = this.persistedQueries.get(key);
    if (mode === "create" && existing) {
      throw new ReplicationError(
        `A persisted query already exists at ${persistedQueryRepositoryPath(input.configurationName, input.name)}. Use POST to update it.`,
        409,
      );
    }
    if (mode === "update" && !existing) {
      throw new ReplicationError(`No persisted query at ${key}. Use PUT to create it.`, 404);
    }
    const now = new Date().toISOString();
    const saved: PersistedQuery = {
      configurationName: input.configurationName,
      name: input.name,
      query: input.query.trim(),
      cacheControl: input.cacheControl ?? existing?.cacheControl,
      surrogateControl: input.surrogateControl ?? existing?.surrogateControl,
      // Like AEM: changes are made on Author and must be (re-)published.
      published: false,
      created: existing?.created ?? now,
      lastModified: now,
      origin: existing?.origin ?? "user",
    };
    this.persistedQueries.set(key, saved);
    this.state.persistedQueries[key] = saved;
    this.state.deletedPersistedQueries = this.state.deletedPersistedQueries.filter((entry) => entry !== key);
    this.saveState();
    return saved;
  }

  deletePersistedQuery(configurationName: string, name: string): boolean {
    const key = `${configurationName}/${name}`;
    const existed = this.persistedQueries.delete(key);
    delete this.state.persistedQueries[key];
    if (existed) this.state.deletedPersistedQueries.push(key);
    this.saveState();
    return existed;
  }

  /** Mirrors POST /bin/replicate.json with cmd=activate|deactivate. */
  replicate(repositoryPath: string, command: "activate" | "deactivate", user: string): AemEvent {
    const pqMatch = /^\/conf\/([^/]+)\/settings\/graphql\/persistentQueries\/([^/]+)$/.exec(repositoryPath);
    if (pqMatch) {
      const query = this.persistedQuery(pqMatch[1], pqMatch[2]);
      if (!query) throw new ReplicationError(`Persisted query not found: ${repositoryPath}`, 404);
      query.published = command === "activate";
      query.lastModified = new Date().toISOString();
      this.state.persistedQueries[`${query.configurationName}/${query.name}`] = query;
      this.saveState();
      return this.emit({
        type: command === "activate" ? "aem.graphql.persistedQuery.published" : "aem.graphql.persistedQuery.unpublished",
        query,
        user,
      });
    }

    const fragment = this.fragments.get(repositoryPath);
    if (!fragment) throw new ReplicationError(`Nothing to replicate at ${repositoryPath}`, 404);
    fragment.published =
      command === "activate"
        ? { content: structuredClone(fragment.content), at: new Date().toISOString(), by: user }
        : null;
    this.persistFragment(fragment);
    return this.emit({
      type: command === "activate" ? "aem.sites.contentFragment.published" : "aem.sites.contentFragment.unpublished",
      fragment,
      user,
    });
  }

  /** Edits the master variation on Author (the Content Fragment Editor). Publish is untouched until replication. */
  updateFragment(fragmentPath: string, changes: Partial<FragmentData>, user: string): ContentFragment {
    const fragment = this.fragments.get(fragmentPath);
    if (!fragment) throw new ReplicationError(`Fragment not found: ${fragmentPath}`, 404);
    fragment.content.master = { ...fragment.content.master, ...changes } as FragmentData;
    fragment.lastModified = new Date().toISOString();
    fragment.lastModifiedBy = user;
    this.persistFragment(fragment);
    this.emit({ type: "aem.sites.contentFragment.modified", fragment, user });
    return fragment;
  }

  /** True when Author has changes that Publish does not have yet. */
  isOutdatedOnPublish(fragment: ContentFragment): boolean {
    return fragment.published !== null && JSON.stringify(fragment.published.content) !== JSON.stringify(fragment.content);
  }

  /* ------------------------------------------------------------------------ */
  /* State file                                                                */
  /* ------------------------------------------------------------------------ */

  private emit(event: AemEvent): AemEvent {
    for (const listener of this.listeners) listener(event);
    return event;
  }

  private persistFragment(fragment: ContentFragment) {
    this.state.fragments[fragment.path] = {
      content: fragment.content,
      published: fragment.published,
      lastModified: fragment.lastModified,
      lastModifiedBy: fragment.lastModifiedBy,
    };
    this.saveState();
  }

  private loadState() {
    if (!this.stateFile || !fs.existsSync(this.stateFile)) return;
    try {
      const loaded = JSON.parse(fs.readFileSync(this.stateFile, "utf8")) as PersistedState;
      if (loaded.version !== 1) return;
      this.state = loaded;
      for (const [fragmentPath, saved] of Object.entries(loaded.fragments)) {
        const fragment = this.fragments.get(fragmentPath);
        if (fragment) Object.assign(fragment, saved);
      }
      for (const key of loaded.deletedPersistedQueries) this.persistedQueries.delete(key);
      for (const [key, query] of Object.entries(loaded.persistedQueries)) this.persistedQueries.set(key, query);
    } catch (error) {
      console.warn(`[mock-aem] Ignoring unreadable state file ${this.stateFile}:`, error);
    }
  }

  private saveState() {
    if (!this.stateFile) return;
    fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
    fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
  }
}
