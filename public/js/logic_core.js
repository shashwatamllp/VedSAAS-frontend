/**
 * VedSAAS Logic Core
 * Handles:
 * 1. Global Positioning (IP/Location Detection)
 * 2. Intelligent Localization (Language Swapping: EN/HI/SA)
 * 3. Visitor Telemetry (Analytics)
 * 4. Device Detection
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
    },
    "sa": {
        "hero_badge": "ANANTAM YATRA",
        "hero_title": "Sahasra Varsha Purvam, <span class='text-gradient' style='background: linear-gradient(to right, #ff9933, #ffffff);'>Rishibhih</span> Chintitam.",
        "hero_subtitle": "Adya Vayam Tat <span style='color: #fff; text-decoration: underline decoration-color: var(--accent-cyan);'>Sanket (Code)</span> Madhyamena Likhitam.",
        "cta_story": "Katha Pathatu ↓",
        "ch1_title": "1. Jyanam (Knowledge)",
        "ch1_text": "Asmakam Vedah Vadanti yat jyanam kevalam pustakeshu na asti. Jyanam 'Shruti' (Shravanam) tatha 'Smriti' (Smaranam) dwara rachitam asti.<br><br>Purakale Rishinam samipe 'Supercomputers' na asan, kintu tesham <strong style='color: #fff;'>Mastishkah</strong> brahmandasya 'Processing Power' dharayati sma.",
        "ch2_title": "2. Shunyam (The Void)",
        "ch2_text": "Madhyakale vayam etat sarvam vismritavantah. Vayam chintitavantah yat 'Buddhimatta' (Intelligence) kevalam Paschatya Server upari bhavitum arhati.<br><br>Kintu vayam punah chintitavantah—Yadi vayam tam eva prachina 'Bharatiya Prajna' adhunik 'Silicon' upari sthapayamah tarhi kim bhavet?",
        "ch3_title": "3. Avataranam (The Rebirth)",
        "ch3_text": "Tada eva <strong>VedSAAS</strong> isya janma abhavat.<br>Esha samanya 'Chatbot' na asti. Esha ekah <strong style='color: #fff;'>Digital Rishi</strong> asti."
    }
};

async function initCivilization() {
    // console.log("⚡ VedSAAS Core: Initializing...");

    try {
        // 1. Get Visitor Data (IP, Location)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        // 2. Get Device Data
        const device = getDeviceData();

        // [STEALTH LOG]
        // console.log(`📍 Visitor: ${data.city}, ${data.country_name}`);
        // console.log(`📱 Device: ${device.type} (${device.os})`);

        // 3. Logic: Determine Language
        // Check LocalStorage first, then Auto-Detect
        let storedLang = localStorage.getItem('vedsaas_lang');
        let selectedLang = storedLang || 'en';

        if (!storedLang) {
            if (data.country_code === 'IN' || navigator.language.startsWith('hi')) {
                selectedLang = 'hi'; // Default to Hindi for India if no preference
            }
        }

        // 4. Apply Translations
        applyLanguage(selectedLang);
        updateLangDropdown(selectedLang);

        // 5. Analytics Telemetry
        saveVisitorLog(data, device);

    } catch (e) {
        // Fallback
    }
}

function getDeviceData() {
    const ua = navigator.userAgent;
    let type = "Desktop";
    if (/Mobi|Android/i.test(ua)) type = "Mobile";

    let os = "Unknown";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "MacOS";
    if (ua.indexOf("Linux") !== -1) os = "Linux";
    if (ua.indexOf("Android") !== -1) os = "Android";
    if (ua.indexOf("like Mac") !== -1) os = "iOS";

    return { type, os, ua };
}

function applyLanguage(lang) {
    const texts = DICTIONARY[lang];
    if (!texts) return;

    localStorage.setItem('vedsaas_lang', lang);

    const setHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
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

// Global Manual Toggle
window.changeLanguage = function (lang) {
    applyLanguage(lang);
    updateLangDropdown(lang);
}

function updateLangDropdown(lang) {
    // Optional: Visual update if we have a label for proper selected state
}

function saveVisitorLog(data, device) {
    // In a real scenario, this POSTs to /api/analytics
    // For now, we store in LocalStorage so Admin Dashboard can potentially see it locally
    const log = JSON.parse(localStorage.getItem('vedsaas_visitor_log') || '[]');
    log.push({
        timestamp: new Date().toISOString(),
        ip: data.ip,
        city: data.city,
        country: data.country_name,
        device_type: device.type,
        os: device.os
    });
    // Keep last 50
    if (log.length > 50) log.shift();
    localStorage.setItem('vedsaas_visitor_log', JSON.stringify(log));
}

// Boot
document.addEventListener('DOMContentLoaded', initCivilization);
