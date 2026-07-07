import webpush from "npm:web-push";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails("mailto:push@stashtracker.app", vapidPublicKey, vapidPrivateKey);

  const { subscription, title, body } = await req.json();
  if (!subscription?.endpoint || !title) {
    return new Response(JSON.stringify({ error: "Missing subscription or title" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: "/icon-192.png", badge: "/icon-192.png" }),
    );
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
