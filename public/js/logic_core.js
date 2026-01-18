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
        "hero_badge": "System Online & Evolving",
        "hero_brand": "VedSAAS",
        "hero_tagline": "The World's First <span class='text-gradient'>Self-Evolving</span> AI Civilization",
        "hero_subtitle": "Combines Ancient Wisdom (Ved) with Modern Intelligence (SAAS). <br><span style='color: var(--accent-cyan);'>Auto-Healing. Decision-Making. Privacy-First.</span>",
        "btn_start": "Start Conversation",
        "btn_explore": "Explore Brain",

        "arch_title": "The 3-Layer Brain Architecture",
        "arch_desc": "A system that thinks before it answers. Orchestrated by the Brain Controller.",
        "arch_controller": "🧠 Brain Controller (Orchestrator)",
        "arch_layer_a": "LAYER A: FastBrain (Local)",
        "arch_layer_b": "LAYER B: Multi-Model Consensus",
        "arch_layer_c": "LAYER C: DeepBrain (Heavy Compute)"
    },
    "hi": {
        "hero_badge": "System Sakriya & Vikassheel",
        "hero_brand": "VedSAAS",
        "hero_tagline": "Duniya ki Pehli <span class='text-gradient'>Swayam-Viksit (Self-Evolving)</span> AI Sabhyata",
        "hero_subtitle": "Prachin Gyaan (Ved) aur Adhunik Buddhi (SAAS) ka Sangam. <br><span style='color: var(--accent-cyan);'>Swatah Upchar (Auto-Heal). Nirnay-Shakti. Privacy-Pratham.</span>",
        "btn_start": "Baatcheet Shuru Karein",
        "btn_explore": "Dimag Ko Samjhein",

        "arch_title": "Tri-Stariya Mastishk Rachna (3-Layer Brain)",
        "arch_desc": "Ek aisa system jo bolne se pehle sochta hai. Brain Controller dwara sanchalit.",
        "arch_controller": "🧠 Brain Controller (Sanchalak)",
        "arch_layer_a": "LAYER A: TezzBrain (Local)",
        "arch_layer_b": "LAYER B: Bahu-Model Sahmati (Consensus)",
        "arch_layer_c": "LAYER C: GahanBrain (Deep Compute)"
    },
    "sa": {
        "hero_badge": "Tantram Sakriyam & Vikashsheelam",
        "hero_brand": "VedSAAS",
        "hero_tagline": "Vishwasya Prathamam <span class='text-gradient'>Atma-Viksit</span> Krutrim Buddhi Sabhyata",
        "hero_subtitle": "Prachin Jananam (Ved) tatha Adhunik Prajna (SAAS) Summelanam. <br><span style='color: var(--accent-cyan);'>Atma-Upchar. Nirnay-Samarthya. Gopniyata-Pratham.</span>",
        "btn_start": "Vartalapam Aarambham",
        "btn_explore": "Mastishkam Pasyatu",

        "arch_title": "Tri-Stariya Mastishk Sanrachana",
        "arch_desc": "Yat vadti tat purvam chintayti. 'Brain Controller' dwara niyantritam.",
        "arch_controller": "🧠 Brain Controller (Niyantrak)",
        "arch_layer_a": "STARA A: Shighra-Mati (Local)",
        "arch_layer_b": "STARA B: Bahu-Model Sahmati",
        "arch_layer_c": "STARA C: Gahan-Mati (Deep Compute)"
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
