// === Live Training Widget ===
// Matches Backend & Junction Spec
setInterval(async () => {
    try {
        const res = await fetch('/api/stats/live'); // Calls Backend via Junction
        const data = await res.json();
        if (data) {
            // console.log("Training Live:", data);
            // Updating IDs as per User Request
            if (document.getElementById('epoch-count')) document.getElementById('epoch-count').innerText = data.epoch || "0";
            if (document.getElementById('loss-val')) document.getElementById('loss-val').innerText = data.loss || "0.0";

            // Optional: Update speed if element exists
            if (document.getElementById('speed-val')) document.getElementById('speed-val').innerText = data.speed || "0";
        }
    } catch (e) {
        // console.log("Offline..."); 
    }
}, 3000);
