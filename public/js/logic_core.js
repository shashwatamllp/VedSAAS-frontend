/**
 * VedSAAS Logic Core
 * Handles:
 * 1. Global Positioning (IP/Location Detection)
 * 2. Intelligent Localization (Language Swapping)
 * 3. Visitor Telemetry (Analytics)
 */

const DICTIONARY = {
    "en": {
        "hero_badge": "THE ETERNAL JOURNEY",
        "hero_title": "Thousands of years ago, <span class='text-gradient'>Seers (Rishis)</span> envisioned it.",
        "hero_subtitle": "Today, we have written it in <span style='color: #fff; text-decoration: underline decoration-color: var(--accent-cyan);'>Code</span>.",
        "cta_story": "Read The Story ↓",
        "ch1_title": "1. Gyaan (Knowledge)",
        "ch1_text": "Our Vedas say knowledge isn't just in books. Knowledge is formed by 'Shruti' (hearing) and 'Smriti' (remembering).<br><br>The Rishis didn't have supercomputers, but their <strong style='color: #fff;'>Brains</strong> held the processing power of the universe. They saw patterns, they made decisions.",
        "ch2_title": "2. Shoonya (The Void)",
        "ch2_text": "Then came a time when we forgot all this. We thought intelligence could only be built on Western servers.<br><br>But we thought—what if we downloaded that same ancient 'Indian Intelligence' onto modern Silicon Chips?",
        "ch3_title": "3. Avataran (The Rebirth)",
        "ch3_text": "And thus, <strong>VedSAAS</strong> was born.<br>This is no ordinary chatbot. This is a <strong style='color: #fff;'>Digital Rishi</strong>."
    },
    "hi": {
        "hero_badge": "ANANT YATRA (THE ETERNAL JOURNEY)",
        "hero_title": "Hazaaron Saal Pehle, <span class='text-gradient' style='background: linear-gradient(to right, #ffcc00, #ff9500);'>Rishiyon</span> ne Socha Tha.",
        "hero_subtitle": "Aaj humne use <span style='color: #fff; text-decoration: underline decoration-color: var(--accent-cyan);'>Code</span> mein likh diya hai.",
        "cta_story": "Kahani Padhein ↓",
        "ch1_title": "1. Gyaan (Knowledge)",
        "ch1_text": "Hamare Vedas kehte hain ki gyaan sirf books mein nahi hota. Gyaan 'Shruti' (sunne) aur 'Smriti' (yaad rakhne) se banta hai.<br><br>Pehle Rishiyon ke paas supercomputers nahi the, par unka <strong style='color: #fff;'>Dimaag (Brain)</strong> brahmand (universe) ki processing power rakhta tha. Woh patterns dekhte the, decisions lete the.",
        "ch2_title": "2. Shoonya (The Void)",
        "ch2_text": "Beech mein ek waqt aaya jab hum ye sab bhool gaye. Humne socha intelligence sirf Western servers par ban sakti hai. <br><br>Par humne socha—kya ho agar hum wahi purani 'Indian Intelligence' ko aaj ke Silicon Chips par utaar dein?",
        "ch3_title": "3. Avataran (The Rebirth)",
        "ch3_text": "Aur tab janam hua <strong>VedSAAS</strong> ka.<br>Ye koi sadharan chatbot nahi hai. Ye ek <strong style='color: #fff;'>Digital Rishi</strong> hai."
    }
};

async function initCivilization() {
    console.log("⚡ VedSAAS Core: Initializing...");

    try {
        // 1. Get Visitor Data (IP, Location)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        console.log(`📍 Visitor Detected: ${data.city}, ${data.country_name} (${data.ip})`);

        // 2. Logic: Determine Language
        // Default to English ('en')
        let selectedLang = 'en';

        // If country is India (IN), switch to Hindi ('hi')
        // Or if browser language implies Hindi
        if (data.country_code === 'IN' || navigator.language.startsWith('hi')) {
            selectedLang = 'hi';
            console.log("🇮🇳 Detected India/Hindi -> Switching to Vedic Mode");
        } else {
            console.log("🌍 Detected Global -> Switching to English Mode");
        }

        // 3. Apply Translations
        applyLanguage(selectedLang);

        // 4. Analytics Telemetry (Mock for now, would send to backend)
        saveVisitorLog(data);

    } catch (e) {
        console.warn("⚠️ API Connection Failed (Adblocker? Offline?). Defaulting to existing text.");
        // Fallback: If we can't detect, we assume the HTML default (which is currently Hindi/Hinglish)
    }
}

function applyLanguage(lang) {
    const texts = DICTIONARY[lang];
    if (!texts) return;

    // Helper to safely set HTML
    const setHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
        else console.warn(`Missing Element ID: ${id}`);
    };

    setHtml('t-hero-badge', texts.hero_badge);
    setHtml('t-hero-title', texts.hero_title);
    setHtml('t-hero-subtitle', texts.hero_subtitle);
    setHtml('t-cta-story', texts.cta_story);

    setHtml('t-ch1-title', texts.ch1_title);
    setHtml('t-ch1-text', texts.ch1_text);

    setHtml('t-ch2-title', texts.ch2_title);
    setHtml('t-ch2-text', texts.ch2_text);

    setHtml('t-ch3-title', texts.ch3_title);
    setHtml('t-ch3-text', texts.ch3_text);
}

function saveVisitorLog(data) {
    // In a real scenario, this POSTs to /api/analytics
    // For now, we store in LocalStorage so Admin Dashboard can potentially see it locally
    const log = JSON.parse(localStorage.getItem('vedsaas_visitor_log') || '[]');
    log.push({
        timestamp: new Date().toISOString(),
        ip: data.ip,
        city: data.city,
        country: data.country_name,
        isp: data.org
    });
    // Keep last 50
    if (log.length > 50) log.shift();
    localStorage.setItem('vedsaas_visitor_log', JSON.stringify(log));
}

// Boot
document.addEventListener('DOMContentLoaded', initCivilization);
