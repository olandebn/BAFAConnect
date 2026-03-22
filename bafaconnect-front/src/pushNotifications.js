/**
 * Service de notifications push (Web Push API + VAPID)
 *
 * Pour activer les push navigateur :
 *  1. Générez des clés VAPID (une fois) :
 *     cd backend && npx web-push generate-vapid-keys
 *  2. Ajoutez dans backend/.env :
 *     VAPID_PUBLIC_KEY=...
 *     VAPID_PRIVATE_KEY=...
 *     VAPID_EMAIL=mailto:votre@email.com
 *  3. Ajoutez dans bafaconnect-front/.env :
 *     VITE_VAPID_PUBLIC_KEY=... (même clé publique)
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Enregistre le service worker et demande la permission de notifications push
 * @returns {Promise<boolean>} true si activé avec succès
 */
export async function activerNotificationsPush(apiInstance) {
  try {
    // 1. Vérifier le support navigateur
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Notifications push non supportées par ce navigateur.');
      return false;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VITE_VAPID_PUBLIC_KEY non configurée — push désactivé.');
      return false;
    }

    // 2. Demander la permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permission notifications refusée.');
      return false;
    }

    // 3. Enregistrer le service worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 4. S'abonner aux push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // 5. Envoyer la subscription au backend
    await apiInstance.post('/notifications/push-subscribe', {
      subscription: subscription.toJSON(),
    });

    console.log('✅ Notifications push activées.');
    return true;
  } catch (err) {
    console.error('Erreur activation push :', err);
    return false;
  }
}

/**
 * Désabonne l'utilisateur des push
 */
export async function desactiverNotificationsPush(apiInstance) {
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return;

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await apiInstance.post('/notifications/push-unsubscribe', {
        endpoint: subscription.endpoint,
      });
    }
    console.log('🔕 Notifications push désactivées.');
  } catch (err) {
    console.error('Erreur désactivation push :', err);
  }
}

/**
 * Vérifie si les push sont actuellement activés pour ce navigateur
 */
export async function estAbonnePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return false;
    const sub = await registration.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
