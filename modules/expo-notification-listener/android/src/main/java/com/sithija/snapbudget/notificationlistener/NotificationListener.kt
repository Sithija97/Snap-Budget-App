package com.sithija.snapbudget.notificationlistener

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class NotificationListener : NotificationListenerService() {
  private var lastKey: String? = null
  private var lastPostTime: Long = 0

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    // Package-allowlist and emission are companion (static) members, not
    // instance members — this service is an OS-managed component that can
    // run and receive notifications independently of whether a JS module
    // instance currently exists (e.g. the app process was killed in the
    // background while this service stays bound), so filtering/queuing must
    // not depend on a live module instance being reachable.
    if (!NotificationListenerModule.isPackageAllowed(sbn.packageName)) return

    // Same notification often re-posts (e.g. progress updates); ignore rapid repeats of the same key.
    if (sbn.key == lastKey && sbn.postTime - lastPostTime < 1000) return
    lastKey = sbn.key
    lastPostTime = sbn.postTime

    val extras = sbn.notification.extras
    val payload = mapOf(
      "packageName" to sbn.packageName,
      "title" to (extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""),
      "text" to (extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""),
      "bigText" to (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""),
      "subText" to (extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""),
      "postTime" to sbn.postTime,
      "key" to sbn.key
    )

    NotificationListenerModule.emitNotification(payload)
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    NotificationListenerModule.setServiceConnected(true)
  }

  override fun onListenerDisconnected() {
    super.onListenerDisconnected()
    NotificationListenerModule.setServiceConnected(false)
  }
}
