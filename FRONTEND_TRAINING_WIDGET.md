# VedSAAS Universal Training Widget

Add live training statistics (Epoch, Loss, Speed) to any HTML page by following these steps.

## 1. Add HTML Elements

Place these elements anywhere in your HTML where you want the numbers to appear. You can stick to your existing design, just make sure the `id` attributes match.

```html
<!-- Example Layout -->
<div class="stats-container">
    <div>
        <h3>Epoch</h3>
        <span id="stat-epoch">0</span>
    </div>
    <div>
        <h3>Loss</h3>
        <span id="stat-loss">0.00</span>
    </div>
    <div>
        <h3>Speed</h3>
        <span id="stat-speed">0</span>
    </div>
    <!-- Optional: Connection Status -->
    <div id="connection-status">Connecting...</div>
</div>
```

## 2. Add the Script

Paste this code at the very bottom of your page, just before the closing `</body>` tag.

```html
<script>
(function() {
    // ==========================================
    // ⚙️ CONFIGURATION: Map your HTML IDs here
    // ==========================================
    const CONFIG = {
        epochId: 'stat-epoch',        // Match your Epoch ID
        lossId:  'stat-loss',         // Match your Loss ID
        speedId: 'stat-speed',        // Match your Speed ID
        statusId: 'connection-status' // Match your Status ID (Optional)
    };
    
    // Server URL: Auto-detects Local (8080) vs Production
    const WS_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'ws://localhost:8080/api/ws/training'
        : 'wss://api.vedsaas.com/api/ws/training';

    // ==========================================
    // 🚀 CONNECTION LOGIC
    // ==========================================
    let socket;
    function connect() {
        if(document.getElementById(CONFIG.statusId)) {
             document.getElementById(CONFIG.statusId).innerText = "Connecting...";
             document.getElementById(CONFIG.statusId).style.color = "orange";
        }

        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            if(document.getElementById(CONFIG.statusId)) {
                document.getElementById(CONFIG.statusId).innerHTML = "● Live";
                document.getElementById(CONFIG.statusId).style.color = "green";
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.epoch !== undefined) {
                    const elEpoch = document.getElementById(CONFIG.epochId);
                    const elLoss  = document.getElementById(CONFIG.lossId);
                    const elSpeed = document.getElementById(CONFIG.speedId);

                    if(elEpoch) elEpoch.innerText = data.epoch;
                    if(elLoss)  elLoss.innerText  = parseFloat(data.loss).toFixed(4);
                    if(elSpeed) elSpeed.innerText = data.speed;
                }
            } catch (e) { console.error("Data Parse Error", e); }
        };

        socket.onclose = () => {
            if(document.getElementById(CONFIG.statusId)) {
                document.getElementById(CONFIG.statusId).innerText = "● Offline";
                document.getElementById(CONFIG.statusId).style.color = "red";
            }
            setTimeout(connect, 3000); // Retry every 3s
        };
    }
    connect();
})();
</script>
```
