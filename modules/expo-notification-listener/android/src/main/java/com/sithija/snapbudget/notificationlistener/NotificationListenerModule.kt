package com.sithija.snapbudget.notificationlistener

import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.atomic.AtomicBoolean

class NotificationListenerModule : Module() {
  private val mainHandler = Handler(Looper.getMainLooper())
  private val isReady = AtomicBoolean(false)
  private val queuedBeforeReady = mutableListOf<Map<String, Any>>()

  @Volatile
  private var allowedPackages: Set<String> = emptySet()

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationListener")

    Events("onNotification", "onListenerConnectionChange")

    OnCreate {
      isReady.set(true)
      instance = this@NotificationListenerModule
      synchronized(queuedBeforeReady) {
        queuedBeforeReady.forEach { sendEvent("onNotification", it) }
        queuedBeforeReady.clear()
      }
    }

    OnDestroy {
      isReady.set(false)
      if (instance === this@NotificationListenerModule) {
        instance = null
      }
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
  }

  fun isPackageAllowed(packageName: String): Boolean = allowedPackages.contains(packageName)

  fun setServiceConnected(connected: Boolean) {
    mainHandler.post {
      if (isReady.get()) {
        sendEvent("onListenerConnectionChange", mapOf("connected" to connected))
      }
    }
  }

  fun emitNotification(payload: Map<String, Any>) {
    mainHandler.post {
      if (isReady.get()) {
        sendEvent("onNotification", payload)
      } else {
        synchronized(queuedBeforeReady) { queuedBeforeReady.add(payload) }
      }
    }
  }

  companion object {
    @Volatile
    private var instance: NotificationListenerModule? = null

    fun getInstance(): NotificationListenerModule? = instance
  }
}
