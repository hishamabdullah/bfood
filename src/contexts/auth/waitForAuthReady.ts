import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/withTimeout";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * On some refresh scenarios, the client needs a brief moment to re-hydrate
 * the persisted session from storage and attach the auth header.
 * This helper waits until getSession() reports the same userId.
 */
export async function waitForAuthReady(
  userId: string,
  {
    timeoutMs = 2500,
    intervalMs = 150,
  }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<boolean> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const { data } = await withTimeout(
        supabase.auth.getSession(),
        800,
        "waitForAuthReady getSession timeout"
      );
      if (data.session?.user?.id === userId) return true;
    } catch {
      // ignore and retry
    }
    await sleep(intervalMs);
  }

  return false;
}
