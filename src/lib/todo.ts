/**
 * Placeholder for code you still have to write. It throws, and the lab workspace shows the
 * message in a friendly "TODO" box instead of crashing the page.
 *
 *   export async function getContinents() {
 *     return todo("query the continents");
 *   }
 */
export class LabTodoError extends Error {
  /**
   * Borrows the digest Next.js uses for expected bail-outs. Without it, a TODO caught by
   * LabBoundary is still logged on the server and reported to the dev overlay, whose issue badge
   * then follows you to every other tab. With it, Next.js skips both, while LabBoundary (which
   * only re-throws redirect/notFound errors) still catches it and shows the TODO box.
   */
  readonly digest = "BAILOUT_TO_CLIENT_SIDE_RENDERING";

  constructor(message: string) {
    super(`TODO: ${message}`);
    this.name = "LabTodoError";
  }
}

export function todo(message: string): never {
  throw new LabTodoError(message);
}

export const isTodoMessage = (message: string) => message.startsWith("TODO:");
