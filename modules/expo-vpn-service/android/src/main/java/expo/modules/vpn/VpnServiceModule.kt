package expo.modules.vpn

import android.app.Activity
import android.content.Intent
import android.net.VpnService
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Coded
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VpnServiceModule : Module() {

    companion object {
        const val TAG = "VpnServiceModule"
        const val VPN_REQUEST_CODE = 1000

        private var instance: VpnServiceModule? = null

        fun sendPacket(data: ByteArray) {
            instance?.sendPacketEvent(data)
        }

        fun sendStatusUpdate() {
            instance?.sendStatusEvent()
        }
    }

    private var currentPromise: Promise? = null

    override fun definition() = ModuleDefinition {
        Name("ExpoVpnService")

        Events("onPacket", "onStatusChange", "onError")

        OnCreate {
            instance = this@VpnServiceModule
            Log.d(TAG, "VpnServiceModule created")
        }

        OnDestroy {
            instance = null
        }

        AsyncFunction("isSupported") { promise: Promise ->
            promise.resolve(true)
        }

        AsyncFunction("hasPermission") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject(Error("Context not available"))
                return@AsyncFunction
            }

            val intent = VpnService.prepare(context)
            promise.resolve(intent == null)
        }

        AsyncFunction("requestPermission") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject(Error("Context not available"))
                return@AsyncFunction
            }

            val intent = VpnService.prepare(context)
            if (intent == null) {
                promise.resolve(true)
            } else {
                currentPromise = promise
                val activity = appContext.currentActivity
                if (activity != null) {
                    activity.startActivityForResult(intent, VPN_REQUEST_CODE)
                } else {
                    promise.reject(Error("No activity available"))
                }
            }
        }

        AsyncFunction("start") { config: Map<String, Any>, promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject(Error("Context not available"))
                return@AsyncFunction
            }

            val intent = VpnService.prepare(context)
            if (intent != null) {
                promise.reject(VpnPermissionException("VPN permission not granted"))
                return@AsyncFunction
            }

            try {
                val serviceIntent = Intent(context, AlbionVpnService::class.java)
                
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }

                promise.resolve(null)
            } catch (e: Exception) {
                Log.e(TAG, "Error starting VPN: ${e.message}")
                promise.reject(e)
            }
        }

        AsyncFunction("stop") { promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject(Error("Context not available"))
                return@AsyncFunction
            }

            try {
                val serviceIntent = Intent(context, AlbionVpnService::class.java)
                context.stopService(serviceIntent)
                promise.resolve(null)
            } catch (e: Exception) {
                Log.e(TAG, "Error stopping VPN: ${e.message}")
                promise.reject(e)
            }
        }

        AsyncFunction("getStatus") { promise: Promise ->
            val status = mapOf(
                "isRunning" to AlbionVpnService.isRunning,
                "packetsCaptured" to AlbionVpnService.packetsCaptured,
                "bytesCaptured" to AlbionVpnService.bytesCaptured
            )
            promise.resolve(status)
        }

        OnActivityResult { activity, requestCode, resultCode, data ->
            if (requestCode == VPN_REQUEST_CODE) {
                val promise = currentPromise
                currentPromise = null

                if (resultCode == Activity.RESULT_OK) {
                    promise?.resolve(true)
                } else {
                    promise?.resolve(false)
                }
            }
        }
    }

    fun sendPacketEvent(data: ByteArray) {
        val eventData = mapOf(
            "data" to data.toList(),
            "timestamp" to System.currentTimeMillis()
        )
        sendEvent("onPacket", eventData)
    }

    fun sendStatusEvent() {
        val status = mapOf(
            "isRunning" to AlbionVpnService.isRunning,
            "packetsCaptured" to AlbionVpnService.packetsCaptured,
            "bytesCaptured" to AlbionVpnService.bytesCaptured,
            "timestamp" to System.currentTimeMillis()
        )
        sendEvent("onStatusChange", status)
    }
}

class VpnPermissionException(message: String) : Coded {
    override val code: String = "VPN_PERMISSION_ERROR"
    override val message: String? = message
}
