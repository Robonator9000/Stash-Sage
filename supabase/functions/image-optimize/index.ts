import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { bucket, paths } = await req.json() as { bucket: string; paths: string[] };
  if (!bucket || !paths?.length) {
    return new Response("Missing bucket or paths", { status: 400 });
  }

  const results: { path: string; status: number }[] = [];

  for (const path of paths) {
    try {
      const { data: file } = await supabase.storage.from(bucket).download(path);
      if (!file) {
        results.push({ path, status: 404 });
        continue;
      }

      const blob = await file;
      const contentType = blob.type;
      let imageData: Uint8Array;

      if (contentType.startsWith("image/")) {
        const buffer = await blob.arrayBuffer();
        imageData = new Uint8Array(buffer);
      } else {
        results.push({ path, status: 415 });
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .update(path.replace(/\.[^.]+$/, ".webp"), imageData, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) {
        results.push({ path, status: 500 });
        continue;
      }

      results.push({ path, status: 200 });
    } catch {
      results.push({ path, status: 500 });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
