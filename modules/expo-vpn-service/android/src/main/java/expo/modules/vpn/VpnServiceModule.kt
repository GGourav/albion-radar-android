package expo.modules.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
                promise.reject(CodedException("NO_ACTIVITY", "No current activity available", null))
                return@Function
            }

            val intent = VpnService.prepare(activity)
            if (intent == null) {
                // Already have permission
                promise.resolve(true)
            } else {
                // Need to request permission via intent
                try {
                    pendingPermissionPromise = promise
                    activity.startActivityForResult(intent, VPN_REQUEST_CODE)
                } catch (e: Exception) {
                    pendingPermissionPromise = null
                    promise.reject(CodedException("PERMISSION_ERROR", e.message, e))
                }
            }
        }

        Function("startVpn") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject(CodedException("NO_CONTEXT", "No React context available", null))
                return@Function
            }

            val activity = appContext.activityProvider?.currentActivity
            val vpnIntent = VpnService.prepare(context)
            
            if (vpnIntent != null) {
                // Need VPN permission first
                try {
                    pendingStartPromise = promise
                    activity?.startActivityForResult(vpnIntent, VPN_REQUEST_CODE)
                } catch (e: Exception) {
                    pendingStartPromise = null
                    promise.reject(CodedException("VPN_PERMISSION_ERROR", e.message, e))
                }
            } else {
                // Already have permission, start VPN
                startVpnService(promise)
            }
        }

        Function("stopVpn") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject(CodedException("NO_CONTEXT", "No React context available", null))
                return@Function
            }

            try {
                val intent = Intent(context, AlbionVpnService::class.java)
                intent.action = AlbionVpnService.ACTION_DISCONNECT
                context.startService(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject(CodedException("STOP_ERROR", e.message, e))
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
                    pendingPermissionPromise?.reject(CodedException("PERMISSION_DENIED", "VPN permission denied by user", null))
                    pendingPermissionPromise = null
                    
                    pendingStartPromise?.reject(CodedException("PERMISSION_DENIED", "VPN permission denied by user", null))
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
            promise.reject(CodedException("NO_CONTEXT", "No React context available", null))
            return
        }

        try {
            val intent = Intent(context, AlbionVpnService::class.java)
            intent.action = AlbionVpnService.ACTION_CONNECT
            context.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(CodedException("START_ERROR", e.message, e))
        }
    }
}
