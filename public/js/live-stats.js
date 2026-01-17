(function () {
    // ==========================================
    // ⚙️ CONFIGURATION: Map your existing HTML IDs here
    // ==========================================
    const CONFIG = {
        epochId: 'stat-epoch',    // Replaced with YOUR Epoch ID
        lossId: 'stat-loss',     // Replaced with YOUR Loss ID
        speedId: 'stat-speed',    // Replaced with YOUR Speed ID
        statusId: 'connection-status' // Replaced with YOUR Status ID
    };

    // Server URL (Auto-detects Prod/Local)
    // Using port 8000 for backend connection as per project convention
    const WS_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:8000/api/ws/training'
        : 'wss://api.vedsaas.com/api/ws/training';

    // ==========================================
    // 🚀 CONNECTION LOGIC (Do Not Edit Below)
    // ==========================================
    let socket;
    function connect() {
        // console.log("Connecting to Live Stream...", WS_URL);

        // Update status to 'Connecting...' if element exists
        if (document.getElementById(CONFIG.statusId)) {
            document.getElementById(CONFIG.statusId).innerText = "Connecting...";
            document.getElementById(CONFIG.statusId).style.color = "var(--text-secondary)";
        }

        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            // console.log("✅ WebSocket Connected");
            if (document.getElementById(CONFIG.statusId)) {
                document.getElementById(CONFIG.statusId).innerHTML = '<i class="fas fa-sync fa-spin"></i> Live';
                document.getElementById(CONFIG.statusId).style.color = "#00ff9d"; // Neon Green
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
                    if (elSpeed) elSpeed.innerText = data.speed;
                }
            } catch (e) { console.error("Parse error:", e); }
        };

        socket.onclose = () => {
            // console.log("❌ WebSocket Disconnected. Retrying...");
            if (document.getElementById(CONFIG.statusId)) {
                document.getElementById(CONFIG.statusId).innerText = "● Reconnecting...";
                document.getElementById(CONFIG.statusId).style.color = "#ff4444";
            }
            setTimeout(connect, 3000); // Retry every 3s
        };

        socket.onerror = (err) => {
            console.error("WebSocket Error:", err);
            socket.close();
        };
    }

    // Start
    connect();
})();
