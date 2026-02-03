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
        "hero_badge": "प्रणाली सक्रिय और विकसित",
        "hero_brand": "VedSAAS",
        "hero_tagline": "विश्व की पहली <span class='text-gradient'>स्वयं-विकसित (Self-Evolving)</span> एआई सभ्यता",
        "hero_subtitle": "प्राचीन ज्ञान (वेद) और आधुनिक बुद्धि (SAAS) का संगम। <br><span style='color: var(--accent-cyan);'>स्वतः सुधार (Auto-Heal)। निर्णय क्षमता। गोपनीयता-प्रथम।</span>",
        "btn_start": "वार्तालाप शुरू करें",
        "btn_explore": "मस्तिष्क को जानें",

        "arch_title": "त्रि-स्तरीय मस्तिष्क संरचना",
        "arch_desc": "एक ऐसी प्रणाली जो उत्तर देने से पहले विचार करती है। ब्रेन कंट्रोलर द्वारा संचालित।",
        "arch_controller": "🧠 ब्रेन कंट्रोलर (संचालक)",
        "arch_layer_a": "स्तर A: तीव्र-मस्तिष्क (Local)",
        "arch_layer_b": "स्तर B: बहु-मॉडल सहमति (Consensus)",
        "arch_layer_c": "स्तर C: गहन-मस्तिष्क (Deep Compute)"
    },
    "sa": {
        "hero_badge": "तन्त्रम् सक्रियम् & विकासशीलम्",
        "hero_brand": "VedSAAS",
        "hero_tagline": "विश्वस्य प्रथमं <span class='text-gradient'>आत्म-विकसितं</span> कृत्रिम-बुद्धि सभ्यता",
        "hero_subtitle": "प्राचीनज्ञानस्य (वेद) आधुनिकप्रज्ञायाः (SAAS) च संगमः। <br><span style='color: var(--accent-cyan);'>आत्म-उपचारः। निर्णय-सामर्थ्यम्। गोपनीयता-प्रथम्।</span>",
        "btn_start": "संवादं आरभत",
        "btn_explore": "मस्तिष्कं पश्यतु",

        "arch_title": "त्रि-स्तरीय मस्तिष्क संरचना",
        "arch_desc": "यत् वदति तत् पूर्वं चिन्तयति। 'ब्रेन कंट्रोलर' द्वारा नियन्त्रितम्।",
        "arch_controller": "🧠 ब्रेन कंट्रोलर (नियन्त्रकः)",
        "arch_layer_a": "स्तरः A: शीघ्र-मतिः (Local)",
        "arch_layer_b": "स्तरः B: बहु-मॉडल सहमतिः",
        "arch_layer_c": "स्तरः C: गहन-मतिः (Deep Compute)"
    }
};

async function initCivilization() {
    let visitorData = { city: "Unknown", country_name: "Unknown", country_code: "US" };
    let deviceData = getDeviceData();
    let selectedLang = localStorage.getItem('vedsaas_lang') || 'en';

    try {
        // 1. Get Visitor Data (IP, Location)
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            visitorData = await response.json();

            // Auto-Detect Language (Only if not set manually)
            if (!localStorage.getItem('vedsaas_lang')) {
                if (visitorData.country_code === 'IN' || navigator.language.startsWith('hi')) {
                    selectedLang = 'hi';
                }
            }
        }
    } catch (e) {
        // API Failed - Stay silent, use default data
    } finally {
        // 2. ALWAYS Apply Language & Analytics
        applyLanguage(selectedLang);
        updateLangDropdown(selectedLang);
        saveVisitorLog(visitorData, deviceData);
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
        if (el) {
            el.innerHTML = html;
        } else {
            // Stealthy console warning for missing elements
            console.warn(`[VedSAAS Localization] Element with ID '${id}' not found.`);
        }
    };

    setHtml('t-hero-badge', texts.hero_badge);
    setHtml('t-hero-brand', texts.hero_brand);
    setHtml('t-hero-tagline', texts.hero_tagline);
    setHtml('t-hero-subtitle', texts.hero_subtitle);
    setHtml('t-btn-start', texts.btn_start);
    setHtml('t-btn-explore', texts.btn_explore);

    setHtml('t-arch-title', texts.arch_title);
    setHtml('t-arch-desc', texts.arch_desc);
    setHtml('t-arch-controller', texts.arch_controller);
    setHtml('t-arch-layer-a', texts.arch_layer_a);
    setHtml('t-arch-layer-b', texts.arch_layer_b);
    setHtml('t-arch-layer-c', texts.arch_layer_c);
}

// Global Manual Toggle
window.changeLanguage = function (lang) {
    applyLanguage(lang);
    updateLangDropdown(lang);
}

function updateLangDropdown(lang) {
    // Optional: Add visual active state to buttons if needed
}

function saveVisitorLog(data, device) {
    // In a real scenario, this POSTs to /api/analytics
    // For now, we store in LocalStorage so Admin Dashboard can potentially see it locally
    const log = JSON.parse(localStorage.getItem('vedsaas_visitor_log') || '[]');
    log.push({
        timestamp: new Date().toISOString(),
        ip: data.ip || 'Hidden',
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
