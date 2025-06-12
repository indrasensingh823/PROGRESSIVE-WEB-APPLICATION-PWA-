// Enhanced Service Worker for ShopEase PWA
const CACHE_NAME = "shopease-enhanced-v3"
const STATIC_CACHE_NAME = "shopease-static-v3"
const DYNAMIC_CACHE_NAME = "shopease-dynamic-v3"

// Files to cache immediately
const STATIC_FILES = ["/", "/index.html", "/styles.css", "/app.js", "/manifest.json", "/products.json"]

// Install event - cache static files
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Enhanced Service Worker...")

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching static files")
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log("[Service Worker] Static files cached successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[Service Worker] Error caching static files:", error)
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Enhanced Service Worker...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME && cacheName.startsWith("shopease-")
              )
            })
            .map((cacheName) => {
              console.log("[Service Worker] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => {
        console.log("[Service Worker] Claiming clients")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache it
          const responseClone = response.clone()

          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(request).then((response) => {
            return response || caches.match("/index.html")
          })
        }),
    )
    return
  }

  // Handle static files (cache first strategy)
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response
        }

        return fetch(request).then((fetchResponse) => {
          const responseClone = fetchResponse.clone()

          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })

          return fetchResponse
        })
      }),
    )
    return
  }

  // Handle API requests and other dynamic content (network first strategy)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()

          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })
        }

        return response
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request)
      }),
  )
})

// Push event - handle push notifications
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received")

  let notificationData = {
    title: "ShopEase",
    body: "You have a new notification!",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "shopease-notification",
    data: {
      url: "/",
    },
  }

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json()
      notificationData = { ...notificationData, ...pushData }
    } catch (error) {
      console.error("[Service Worker] Error parsing push data:", error)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        {
          action: "view",
          title: "View",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
      vibrate: [100, 50, 100],
      requireInteraction: false,
    }),
  )
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked")

  event.notification.close()

  const action = event.action
  const notificationData = event.notification.data || {}

  if (action === "dismiss") {
    return
  }

  // Default action or 'view' action
  const urlToOpen = notificationData.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }

      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      // Perform background sync operations
      syncData(),
    )
  }
})

// Sync data function
async function syncData() {
  try {
    console.log("[Service Worker] Syncing data...")
    // In a real app, you would sync cart, wishlist, and user data with your server
    console.log("[Service Worker] Data sync completed")
  } catch (error) {
    console.error("[Service Worker] Error syncing data:", error)
  }
}

// Message event - communicate with main thread
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
