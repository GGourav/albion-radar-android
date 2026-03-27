package expo.modules.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

class AlbionVpnService : VpnService() {

    companion object {
        const val TAG = "AlbionVpnService"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "albion_vpn_channel"
        const val TARGET_PORT = 5056
        const val MTU = 2048

        @Volatile
        var isRunning = false
            private set

        @Volatile
        var packetsCaptured = 0L
            private set

        @Volatile
        var bytesCaptured = 0L
            private set

        private var packetListener: ((ByteArray) -> Unit)? = null

        fun setPacketListener(listener: (ByteArray) -> Unit) {
            packetListener = listener
        }

        fun clearPacketListener() {
            packetListener = null
        }
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var vpnThread: Thread? = null
    private var running = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "VPN service starting...")

        if (running) {
            Log.w(TAG, "VPN service already running")
            return START_STICKY
        }

        // Start foreground service
        startForeground(NOTIFICATION_ID, createNotification())

        // Setup VPN interface
        vpnInterface = setupVpnInterface()

        if (vpnInterface == null) {
            Log.e(TAG, "Failed to create VPN interface")
            stopSelf()
            return START_NOT_STICKY
        }

        running = true
        isRunning = true

        // Start packet capture thread
        vpnThread = Thread { capturePackets() }
        vpnThread?.start()

        Log.d(TAG, "VPN service started successfully")
        VpnServiceModule.sendStatusUpdate()

        return START_STICKY
    }

    private fun setupVpnInterface(): ParcelFileDescriptor? {
        return try {
            Builder()
                .setSession("Albion Radar VPN")
                .setMtu(MTU)
                .addAddress("10.0.0.2", 32)
                .addRoute("0.0.0.0", 0)
                .addDnsServer("8.8.8.8")
                .addDnsServer("8.8.4.4")
                .also { builder ->
                    // Allow all apps (we filter in the packet capture)
                    // To restrict to Albion Online only:
                    // builder.addAllowedApplication("com.albiononline")
                }
                .establish()
        } catch (e: Exception) {
            Log.e(TAG, "Error setting up VPN interface: ${e.message}")
            null
        }
    }

    private fun capturePackets() {
        val vpnInput = FileInputStream(vpnInterface?.fileDescriptor)
        val vpnOutput = FileOutputStream(vpnInterface?.fileDescriptor)
        val buffer = ByteBuffer.allocate(MTU)

        Log.d(TAG, "Starting packet capture loop")

        while (running && vpnInterface != null) {
            try {
                // Read packet from TUN interface
                buffer.clear()
                val length = vpnInput.read(buffer.array())

                if (length > 0) {
                    packetsCaptured++
                    bytesCaptured += length

                    // Parse IP header to get protocol and ports
                    val packetData = buffer.array().sliceArray(0 until length)

                    // Check if this is a UDP packet on port 5056
                    if (isAlbionPacket(packetData, length)) {
                        // Extract the UDP payload (Photon data)
                        val photonData = extractPhotonPayload(packetData, length)

                        if (photonData != null) {
                            // Notify listener
                            packetListener?.invoke(photonData)

                            // Send to React Native
                            VpnServiceModule.sendPacket(photonData)
                        }
                    }

                    // Write packet back (passthrough)
                    vpnOutput.write(packetData)
                    vpnOutput.flush()
                }

            } catch (e: Exception) {
                if (running) {
                    Log.e(TAG, "Error capturing packet: ${e.message}")
                }
            }
        }

        Log.d(TAG, "Packet capture loop ended")
    }

    private fun isAlbionPacket(packet: ByteArray, length: Int): Boolean {
        if (length < 28) return false

        // IP header version (first 4 bits)
        val version = (packet[0].toInt() shr 4) and 0x0F
        if (version != 4) return false // Only IPv4

        // Protocol (byte 9)
        val protocol = packet[9].toInt() and 0xFF
        if (protocol != 17) return false // 17 = UDP

        // UDP header starts at byte 20 for IPv4
        // Source port (bytes 20-21), Destination port (bytes 22-23)
        val sourcePort = ((packet[20].toInt() and 0xFF) shl 8) or (packet[21].toInt() and 0xFF)
        val destPort = ((packet[22].toInt() and 0xFF) shl 8) or (packet[23].toInt() and 0xFF)

        return sourcePort == TARGET_PORT || destPort == TARGET_PORT
    }

    private fun extractPhotonPayload(packet: ByteArray, length: Int): ByteArray? {
        if (length < 28) return null

        // UDP header is 8 bytes, so data starts at byte 28
        // UDP length field (bytes 24-25) includes header
        val udpLength = ((packet[24].toInt() and 0xFF) shl 8) or (packet[25].toInt() and 0xFF)
        val payloadLength = udpLength - 8

        if (payloadLength <= 0 || 28 + payloadLength > length) return null

        return packet.sliceArray(28 until 28 + payloadLength)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Albion Radar VPN Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "VPN service for Albion Radar packet capture"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            packageManager.getLaunchIntentForPackage(packageName),
            PendingIntent.FLAG_IMMUTABLE
        )

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Albion Radar Active")
                .setContentText("Capturing game packets...")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
                .setContentTitle("Albion Radar Active")
                .setContentText("Capturing game packets...")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build()
        }
    }

    override fun onDestroy() {
        Log.d(TAG, "VPN service destroying...")
        running = false
        isRunning = false

        vpnThread?.interrupt()
        vpnThread = null

        vpnInterface?.close()
        vpnInterface = null

        VpnServiceModule.sendStatusUpdate()
        super.onDestroy()
    }

    override fun onRevoke() {
        Log.d(TAG, "VPN permission revoked")
        stopSelf()
        super.onRevoke()
    }
}
