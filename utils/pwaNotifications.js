/**
 * Utilitário para Solicitar Permissão de Notificação e Testar
 */
export async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return 'unsupported';
    }

    // Check current permission
    if (Notification.permission === "granted") {
        // Already granted
        sendTestNotification();
        return 'granted';
    } else if (Notification.permission !== "denied") {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            sendTestNotification();
            return 'granted';
        }
        return permission; // 'denied' or 'default'
    }

    return 'denied';
}

function sendTestNotification() {
    try {
        // Service Worker registration is required for cleaner mobile notifications, 
        // but new Notification() works on Desktop and some Android contexts directly if page is open.
        // Best practice for PWAs is usually via ServiceWorkerRegistration.showNotification(), 
        // but this simple API is good for a quick test.
        new Notification("Clinic Pro", {
            body: "Notificações ativadas com sucesso! 🔔",
            icon: "/pwa-192x192.png", // Ensure this path exists or it will just be text
            vibrate: [200, 100, 200]
        });
    } catch (e) {
        console.error("Failed to send notification", e);
    }
}
