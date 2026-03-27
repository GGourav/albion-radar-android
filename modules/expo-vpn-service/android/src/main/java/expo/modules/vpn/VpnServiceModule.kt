package expo.modules.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.ActivityResultHandler

class VpnServiceModule : Module() {
    companion object {
        private const val VPN_REQUEST_CODE = 1001
    }

    override fun definition() = ModuleDefinition {
        Name("ExpoVpnService")

        Events("onVpnStateChanged", "onPacketReceived", "onError")

        Function("hasVpnPermission") {
            val activity = appContext.activityProvider?.currentActivity
            if (activity == null) {
                false
            } else {
                val intent = VpnService.prepare(activity)
                intent == null
            }
        }

        Function("requestVpnPermission") { promise: Promise ->
            val activity = appContext.activityProvider?.currentActivity
            if (activity == null) {
                promise.reject("NO_ACTIVITY", "No current activity available")
                return@Function
            }

            val intent = VpnService.prepare(activity)
            if (intent == null) {
                // Already have permission
                promise.resolve(true)
            } else {
                // Need to request permission via intent
                try {
                    activity.startActivityForResult(intent, VPN_REQUEST_CODE)
                    // Store promise to resolve later
                    pendingPermissionPromise = promise
                } catch (e: Exception) {
                    promise.reject("PERMISSION_ERROR", e.message)
                }
            }
        }

        Function("startVpn") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject("NO_CONTEXT", "No React context available")
                return@Function
            }

            val activity = appContext.activityProvider?.currentActivity
            val vpnIntent = VpnService.prepare(context)
            
            if (vpnIntent != null) {
                // Need VPN permission first
                try {
                    activity?.startActivityForResult(vpnIntent, VPN_REQUEST_CODE)
                    pendingStartPromise = promise
                } catch (e: Exception) {
                    promise.reject("VPN_PERMISSION_ERROR", e.message)
                }
            } else {
                // Already have permission, start VPN
                startVpnService(promise)
            }
        }

        Function("stopVpn") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject("NO_CONTEXT", "No React context available")
                return@Function
            }

            try {
                val intent = Intent(context, AlbionVpnService::class.java)
                intent.action = AlbionVpnService.ACTION_DISCONNECT
                context.startService(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STOP_ERROR", e.message)
            }
        }

        Function("isVpnRunning") {
            AlbionVpnService.isRunning
        }

        OnActivityResult { activity, payload ->
            if (payload.requestCode == VPN_REQUEST_CODE) {
                if (payload.resultCode == Activity.RESULT_OK) {
                    // Permission granted
                    pendingPermissionPromise?.resolve(true)
                    pendingPermissionPromise = null
                    
                    // If there was a pending start request, start VPN now
                    pendingStartPromise?.let { promise ->
                        startVpnService(promise)
                        pendingStartPromise = null
                    }
                } else {
                    // Permission denied
                    pendingPermissionPromise?.reject("PERMISSION_DENIED", "VPN permission denied by user")
                    pendingPermissionPromise = null
                    
                    pendingStartPromise?.reject("PERMISSION_DENIED", "VPN permission denied by user")
                    pendingStartPromise = null
                }
            }
        }
    }

    private var pendingPermissionPromise: Promise? = null
    private var pendingStartPromise: Promise? = null

    private fun startVpnService(promise: Promise) {
        val context = appContext.reactContext
        if (context == null) {
            promise.reject("NO_CONTEXT", "No React context available")
            return
        }

        try {
            val intent = Intent(context, AlbionVpnService::class.java)
            intent.action = AlbionVpnService.ACTION_CONNECT
            context.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_ERROR", e.message)
        }
    }
}
