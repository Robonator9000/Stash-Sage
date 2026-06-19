import { withSupabase } from "npm:@supabase/server"

export default {
  fetch: withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 })
    }

    const { bucket, paths } = await req.json() as { bucket: string; paths: string[] }
    if (!bucket || !paths?.length) {
      return new Response("Missing bucket or paths", { status: 400 })
    }

    const results: { path: string; status: number }[] = []

    for (const path of paths) {
      try {
        const { data: file } = await ctx.supabaseAdmin.storage.from(bucket).download(path)
        if (!file) {
          results.push({ path, status: 404 })
          continue
        }

        const blob = await file
        const contentType = blob.type

        if (contentType.startsWith("image/")) {
          const buffer = await blob.arrayBuffer()
          const imageData = new Uint8Array(buffer)

          const { error: uploadError } = await ctx.supabaseAdmin.storage
            .from(bucket)
            .update(path.replace(/\.[^.]+$/, ".webp"), imageData, {
              contentType: "image/webp",
              upsert: true,
            })

          if (uploadError) {
            results.push({ path, status: 500 })
            continue
          }

          results.push({ path, status: 200 })
        } else {
          results.push({ path, status: 415 })
        }
      } catch {
        results.push({ path, status: 500 })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
    })
  }),
}
