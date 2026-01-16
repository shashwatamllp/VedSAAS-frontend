(function () {
    // ==========================================
    // ⚙️ CONFIGURATION: Map your existing HTML IDs here
    // ==========================================
    const CONFIG = {
        epochId: 'stat-epoch',
        lossId: 'stat-loss',
        speedId: 'stat-speed',
        statusId: 'connection-status'
    };

    // Server URL (Auto-detects Prod/Local)
    // Defaults to localhost:8000 if on localhost, else wss://api.vedsaas.com
    // NOTE: Port 8000 is for backend. If frontend is on 3000, we need to point to 8000.
    const WS_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:8000/api/ws/training'
        : 'wss://api.vedsaas.com/api/ws/training';

    // ==========================================
    // 🚀 CONNECTION LOGIC
    // ==========================================
    let socket;
    function connect() {
        // Only log connection attempt if explicitly debugging or on status change
        // console.log("Connecting to Live Stream...", WS_URL);

        try {
            socket = new WebSocket(WS_URL);
        } catch (e) {
            console.error("WS Init Error:", e);
            scheduleRetry();
            return;
        }

        socket.onopen = () => {
            console.log("✅ WebSocket Connected");
            if (document.getElementById(CONFIG.statusId)) {
                const el = document.getElementById(CONFIG.statusId);
                el.innerText = "● Live";
                el.style.color = "#22c55e"; // Green
                // Add pulse effect if class exists
                if (!el.classList.contains('pulse-text')) el.classList.add('pulse-text');
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Update UI if data exists
                if (data.epoch !== undefined) {
                    const elEpoch = document.getElementById(CONFIG.epochId);
                    const elLoss = document.getElementById(CONFIG.lossId);
                    const elSpeed = document.getElementById(CONFIG.speedId);

                    if (elEpoch) elEpoch.innerText = data.epoch;
                    if (elLoss) elLoss.innerText = parseFloat(data.loss).toFixed(4);
                    // Format speed with commas
                    if (elSpeed) elSpeed.innerText = Number(data.speed).toLocaleString();
                }
            } catch (e) { console.error("Parse error:", e); }
        };

        socket.onclose = () => {
            handleDisconnect();
        };

        socket.onerror = (err) => {
            console.warn("WS Error", err);
            socket.close();
        };
    }

    function handleDisconnect() {
        if (document.getElementById(CONFIG.statusId)) {
            const el = document.getElementById(CONFIG.statusId);
            el.innerText = "● Reconnecting...";
            el.style.color = "#ef4444"; // Red
        }
        scheduleRetry();
    }

    let retryTimer = null;
    function scheduleRetry() {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(connect, 3000); // Retry every 3s
    }

    // Start
    connect();
})();
