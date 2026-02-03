(function () {
    // ==========================================
    // ⚙️ CONFIGURATION: Map your existing HTML IDs here
    // ==========================================
    const CONFIG = {
        epochId: 'stat-epoch',
        lossId: 'stat-loss',
        speedId: 'stat-speed',
        statusId: 'connection-status',
        pollInterval: 2000 // 2 seconds
    };

    // Use Relative Path (Proxied by Junction)
    const API_URL = '/api/stats/live';

    // WebSocket Configuration (For future real-time streaming)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const WS_URL = `${protocol}//${window.location.host}/api/ws/training`;

    // ==========================================
    // 🚀 POLLING LOGIC (Robust & Firewall Friendly)
    // ==========================================
    async function fetchStats() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Network response was not ok");

            const envelope = await response.json();
            // Backend returns { ok: true, stats: { epoch: ..., loss: ...} }
            const data = envelope.stats || envelope;

            if (data) {
                const elEpoch = document.getElementById(CONFIG.epochId);
                const elLoss = document.getElementById(CONFIG.lossId);
                const elSpeed = document.getElementById(CONFIG.speedId);

                if (elEpoch) elEpoch.innerText = data.epoch || 0;
                if (elLoss) elLoss.innerText = data.loss ? parseFloat(data.loss).toFixed(4) : "0.00";
                if (elSpeed) elSpeed.innerText = data.speed || 0;
            }

            // Update Status Indicator
            const statusEl = document.getElementById(CONFIG.statusId);
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#00ff9d">• Live</span>';
            }

        } catch (error) {
            console.warn("Stats Poll Error:", error);
            const statusEl = document.getElementById(CONFIG.statusId);
            if (statusEl) {
                statusEl.innerHTML = '<span style="color:#ffb3b3">• Connecting...</span>';
            }
        }
    }

    // Start Polling
    fetchStats(); // Initial call
    setInterval(fetchStats, CONFIG.pollInterval);
})();
