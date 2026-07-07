import { supabase, isConfigured } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const FUNCTIONS_URL = SUPABASE_URL.replace(/https?:\/\//, '').includes('.supabase.co')
  ? SUPABASE_URL.replace(/\/$/, '').replace('supabase.co', 'functions.supabase.co')
  : '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

async function getSessionUser() {
  const res = await supabase.auth.getSession();
  if (res.error || !res.data?.session) return null;
  return res.data.session.user;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !VAPID_PUBLIC_KEY) return null;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    } as any);
  }
  return subscription;
}

export async function subscribeToPush(): Promise<void> {
  if (!isConfigured || !VAPID_PUBLIC_KEY) return;
  const user = await getSessionUser();
  if (!user) return;
  const sub = await getPushSubscription();
  if (!sub) return;
  const subJSON = sub.toJSON();
  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subJSON.endpoint!,
    p256dh_key: ((subJSON.keys as Record<string, string>)?.p256dh) || '',
    auth_key: ((subJSON.keys as Record<string, string>)?.auth) || '',
  }, { onConflict: 'user_id,endpoint' });
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!isConfigured) return;
  const user = await getSessionUser();
  if (!user) return;
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  }
  await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
}

export async function triggerPush(title: string, body: string): Promise<void> {
  if (!FUNCTIONS_URL || !VAPID_PUBLIC_KEY || !isConfigured) return;
  const sessionRes = await supabase.auth.getSession();
  const accessToken = sessionRes.data?.session?.access_token;
  if (!accessToken) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await fetch(`${FUNCTIONS_URL}/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        subscription: sub.toJSON(),
        title,
        body,
      }),
    });
  } catch { }
}
