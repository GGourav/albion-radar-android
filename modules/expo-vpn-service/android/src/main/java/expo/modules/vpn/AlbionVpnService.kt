package expo.modules.vpn

import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.modules.Module
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

class AlbionVpnService : VpnService() {
    companion object {
        const val TAG = "AlbionVpnService"
        const val ACTION_CONNECT = "expo.modules.vpn.CONNECT"
        const val ACTION_DISCONNECT = "expo.modules.vpn.DISCONNECT"
        
        @Volatile
        var isRunning: Boolean = false
            private set
        
        private var instance: AlbionVpnService? = null
        
        fun sendPacket(data: ByteArray) {
            instance?.let { service ->
                try {
                    service.packetQueue?.add(data)
                } catch (e: Exception) {
                    Log.e(TAG, "Error queueing packet: ${e.message}")
                }
            }
        }
        
        fun sendStatusUpdate(status: String) {
            instance?.let { service ->
                try {
                    service.status = status
                } catch (e: Exception) {
                    Log.e(TAG, "Error updating status: ${e.message}")
                }
            }
        }
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunningVpn = false
    private var packetQueue: java.util.concurrent.ConcurrentLinkedQueue<ByteArray>? = null
    private var status: String = "disconnected"
    private var workerThread: Thread? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        packetQueue = java.util.concurrent.ConcurrentLinkedQueue()
    }

    override fun onDestroy() {
        stopVpn()
        instance = null
        packetQueue = null
        super.onDestroy()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_CONNECT -> {
                startVpn()
            }
            ACTION_DISCONNECT -> {
                stopVpn()
            }
        }
        return START_STICKY
    }

    private fun startVpn() {
        if (isRunningVpn) return

        try {
            // Configure VPN interface
            val builder = Builder()
                .setSession("AlbionRadar")
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0)
                .setMtu(1500)
            
            // Try to exclude Albion server port from VPN
            // This allows the game traffic to pass through while we monitor
            try {
                builder.addDisallowedApplication("com.sandboxinteractive.albiononline")
            } catch (e: Exception) {
                Log.w(TAG, "Could not exclude Albion app: ${e.message}")
            }

            vpnInterface = builder.establish()
            
            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface")
                return
            }

            isRunningVpn = true
            isRunning = true
            status = "connected"
            
            // Start packet processing thread
            startPacketProcessing()
            
            Log.i(TAG, "VPN service started successfully")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error starting VPN: ${e.message}")
            status = "error: ${e.message}"
            stopVpn()
        }
    }

    private fun stopVpn() {
        isRunningVpn = false
        isRunning = false
        status = "disconnected"
        
        workerThread?.interrupt()
        workerThread = null
        
        vpnInterface?.close()
        vpnInterface = null
        
        packetQueue?.clear()
        
        Log.i(TAG, "VPN service stopped")
    }

    private fun startPacketProcessing() {
        workerThread = Thread {
            val buffer = ByteBuffer.allocate(32767)
            val inputStream = FileInputStream(vpnInterface!!.fileDescriptor)
            
            while (isRunningVpn && !Thread.currentThread().isInterrupted) {
                try {
                    // Read packet from VPN interface
                    buffer.clear()
                    val length = inputStream.read(buffer.array())
                    
                    if (length > 0) {
                        buffer.limit(length)
                        processPacket(buffer.array(), length)
                    }
                    
                    // Process outgoing packets from queue
                    packetQueue?.poll()?.let { packet ->
                        writeToVpn(packet)
                    }
                    
                } catch (e: Exception) {
                    if (isRunningVpn) {
                        Log.e(TAG, "Error processing packets: ${e.message}")
                    }
                    break
                }
            }
        }.apply {
            start()
        }
    }

    private fun writeToVpn(data: ByteArray) {
        try {
            vpnInterface?.fileDescriptor?.let { fd ->
                val outputStream = FileOutputStream(fd)
                outputStream.write(data)
                outputStream.flush()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error writing to VPN: ${e.message}")
        }
    }

    private fun processPacket(data: ByteArray, length: Int) {
        if (length < 20) return // Minimum IP header size
        
        try {
            // Parse IP header
            val version = (data[0].toInt() shr 4) and 0x0F
            if (version != 4) return // Only IPv4
            
            // Get source and destination ports (TCP/UDP)
            val protocol = data[9].toInt() and 0xFF
            val srcPort = ((data[20].toInt() and 0xFF) shl 8) or (data[21].toInt() and 0xFF)
            val dstPort = ((data[22].toInt() and 0xFF) shl 8) or (data[23].toInt() and 0xFF)
            
            // Check if this is Albion traffic (port 5056)
            if (srcPort == 5056 || dstPort == 5056) {
                // Extract payload
                val ipHeaderLength = (data[0].toInt() and 0x0F) * 4
                val transportHeaderLength = if (protocol == 6) 20 else 8 // TCP or UDP
                
                val payloadStart = ipHeaderLength + transportHeaderLength
                if (length > payloadStart) {
                    val payload = data.copyOfRange(payloadStart, length)
                    parseAlbionPacket(payload)
                }
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing packet: ${e.message}")
        }
    }

    private fun parseAlbionPacket(payload: ByteArray) {
        if (payload.size < 2) return
        
        try {
            // Albion uses Photon Protocol (Protocol16)
            // Try to extract event type and data
            val eventType = (payload[0].toInt() and 0xFF)
            
            // Log for debugging
            Log.d(TAG, "Albion packet: type=$eventType size=${payload.size}")
            
            // TODO: Parse specific Albion events
            // - Player movement
            // - Mob spawns
            // - Resource nodes
            // - Combat events
            
        } catch (e: Exception) {
            Log.e(TAG, "Error parsing Albion packet: ${e.message}")
        }
    }
}
