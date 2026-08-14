package com.sithija.snapbudget.notificationlistener

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

class NotificationListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationListener")

    Events("onNotification", "onListenerConnectionChange")

    OnCreate {
      instance = this@NotificationListenerModule
      // Deliberately does NOT flip listenerReady / auto-flush here — JS
      // hasn't called addListener("onNotification", ...) yet at this point
      // (OnCreate fires as soon as the native module exists, before
      // lib/notificationCapture.ts's startNotificationCapture() has run),
      // and a native EventEmitter does not buffer/replay events emitted
      // before a listener subscribes, the same as a standard JS
      // EventEmitter — sendEvent() here would silently lose exactly the
      // notifications this queue exists to protect. JS instead calls
      // markListenerReady() itself immediately after addListener(), which is
      // what actually flips this module into "OK to sendEvent live" mode and
      // flushes anything queued up to that point.
    }

    OnDestroy {
      listenerReady.set(false)
      if (instance === this@NotificationListenerModule) {
        instance = null
      }
      // Deliberately NOT clearing allowedPackages/queuedNotifications here —
      // Android's NotificationListenerService (see NotificationListener.kt)
      // is an OS-managed component that can keep running and receiving
      // notifications independently of this module's lifecycle (e.g. the
      // app process is killed in the background by the OS/OEM battery
      // manager while the listener stays bound). Without preserving state
      // across a module recreate, every notification that arrives during
      // that window was previously silently dropped — emitNotification()
      // saw a null module instance and returned early with no queue to
      // catch it, so capture would go from "working" to "captures nothing"
      // the moment the app's process got killed in the background, with no
      // error anywhere to signal why.
    }

    Function("isAccessGranted") {
      val context = appContext.reactContext ?: return@Function false
      val flat = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      flat?.contains(context.packageName) ?: false
    }

    Function("openAccessSettings") {
      val context = appContext.reactContext ?: return@Function Unit
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("setAllowedPackages") { packages: List<String> ->
      allowedPackages = packages.toSet()
    }

    // Called by JS immediately after it registers its "onNotification"
    // listener (see startNotificationCapture) — flips this module into
    // "deliver events live via sendEvent" mode and flushes anything that
    // queued up before this point (module just (re)created, or notifications
    // arrived before JS finished wiring up). Only from here on does
    // emitNotification() call sendEvent() directly instead of queuing.
    Function("markListenerReady") {
      flushQueue()
      listenerReady.set(true)
    }
  }

  private fun flushQueue() {
    val toSend = synchronized(queuedNotifications) {
      val copy = queuedNotifications.toList()
      queuedNotifications.clear()
      copy
    }
    toSend.forEach { sendEvent("onNotification", it) }
  }

  companion object {
    private val mainHandler = Handler(Looper.getMainLooper())

    // True only once JS has confirmed its "onNotification" listener is
    // registered (see markListenerReady above) — gates whether
    // emitNotification() delivers live via sendEvent or queues instead.
    private val listenerReady = AtomicBoolean(false)

    // Capped so a long stretch with no live module instance (app killed in
    // the background for hours) can't grow this unboundedly in memory —
    // old queued notifications are dropped oldest-first past the cap, same
    // policy as useCaptureStore's MAX_STORED_SUGGESTIONS on the JS side.
    private const val MAX_QUEUED = 50
    private val queuedNotifications = ArrayDeque<Map<String, Any>>()

    @Volatile
    private var instance: NotificationListenerModule? = null

    @Volatile
    private var allowedPackages: Set<String> = emptySet()

    fun isPackageAllowed(packageName: String): Boolean = allowedPackages.contains(packageName)

    fun setServiceConnected(connected: Boolean) {
      mainHandler.post {
        val current = instance
        if (listenerReady.get() && current != null) {
          current.sendEvent("onListenerConnectionChange", mapOf("connected" to connected))
        }
      }
    }

    // Called from NotificationListener (the OS-level service) whenever a
    // notification is posted. Delivers live if a JS listener has confirmed
    // it's ready (see markListenerReady); otherwise queues so nothing is
    // lost to the "service running, JS not caught up yet" window.
    fun emitNotification(payload: Map<String, Any>) {
      mainHandler.post {
        val current = instance
        if (listenerReady.get() && current != null) {
          current.sendEvent("onNotification", payload)
        } else {
          synchronized(queuedNotifications) {
            queuedNotifications.addLast(payload)
            while (queuedNotifications.size > MAX_QUEUED) {
              queuedNotifications.removeFirst()
            }
          }
        }
      }
    }
  }
}
