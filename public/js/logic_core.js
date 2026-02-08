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
    // ... (Hindi & Sanskrit preserved via merge, but re-declaring for clarity/completeness in this block is safer if replacing whole object)
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
    },
    // Regional India
    "mr": { // Marathi (Maharashtra)
        "hero_badge": "प्रणाली सक्रिय आणि विकसित",
        "hero_brand": "VedSAAS",
        "hero_tagline": "जगातील पहिली <span class='text-gradient'>स्वयं-विकसित</span> एआय सभ्यता",
        "hero_subtitle": "वेद आणि आधुनिक बुद्धिमत्ता (SAAS) यांचा संगम. <br><span style='color: var(--accent-cyan);'>स्वयं-उपचार. निर्णय क्षमता. गोपनीयता-प्रथम.</span>",
        "btn_start": "संभाषण सुरू करा",
        "btn_explore": "मेंदू एक्सप्लोर करा",
        "arch_title": "त्रि-स्तरीय मेंदू संरचना",
        "arch_desc": "उत्तर देण्यापूर्वी विचार करणारी प्रणाली. ब्रेन कंट्रोलरद्वारे संचालित.",
        "arch_controller": "🧠 ब्रेन कंट्रोलर (सूत्रधार)",
        "arch_layer_a": "लेअर A: जलद-मेंदू (Local)",
        "arch_layer_b": "लेअर B: बहु-मॉडेल सहमती",
        "arch_layer_c": "लेअर C: दीप-मेंदू (Deep Compute)"
    },
    "bn": { // Bengali (West Bengal)
        "hero_badge": "सिस्टम ऑनलाइन এবং বিবর্তিত",
        "hero_brand": "VedSAAS",
        "hero_tagline": "বিশ্বের প্রথম <span class='text-gradient'>স্ব-বিবর্তিত</span> এআই সভ্যতা",
        "hero_subtitle": "প্রাচীন জ্ঞান (বেদ) এবং আধুনিক বুদ্ধিমত্তা (SAAS) এর সংমিশ্রণ।",
        "btn_start": "কথপোকথন শুরু করুন",
        "btn_explore": "মস্তিষ্ক অন্বেষণ করুন",
        "arch_title": "৩-স্তরের মস্তিষ্ক স্থাপত্য",
        "arch_desc": "একটি সিস্টেম যা উত্তর দেওয়ার আগে চিন্তা করে।",
        "arch_controller": "🧠 ব্রেন কন্ট্রোলার",
        "arch_layer_a": "স্তর A: দ্রুত মস্তিষ্ক",
        "arch_layer_b": "স্তর B: বহু-মডেল ঐক্যমত",
        "arch_layer_c": "স্তর C: গভীর মস্তিষ্ক"
    },
    // Global
    "fr": { // French
        "hero_badge": "Système en ligne et évolutif",
        "hero_brand": "VedSAAS",
        "hero_tagline": "La première civilisation IA <span class='text-gradient'>auto-évolutive</span> au monde",
        "hero_subtitle": "Combine la sagesse ancienne (Ved) avec l'intelligence moderne (SAAS).",
        "btn_start": "Commencer la conversation",
        "btn_explore": "Explorer le cerveau",
        "arch_title": "L'architecture cérébrale à 3 couches",
        "arch_desc": "Un système qui réfléchit avant de répondre.",
        "arch_controller": "🧠 Contrôleur Cérébral",
        "arch_layer_a": "COUCHE A: Cerveau Rapide",
        "arch_layer_b": "COUCHE B: Consensus Multi-Modèle",
        "arch_layer_c": "COUCHE C: Cerveau Profond"
    },
    "es": { // Spanish
        "hero_badge": "Sistema en línea y en evolución",
        "hero_brand": "VedSAAS",
        "hero_tagline": "La primera civilización de IA <span class='text-gradient'>auto-evolutiva</span> del mundo",
        "hero_subtitle": "Combina la sabiduría antigua (Ved) con la inteligencia moderna (SAAS).",
        "btn_start": "Iniciar conversación",
        "btn_explore": "Explorar cerebro",
        "arch_title": "Arquitectura cerebral de 3 capas",
        "arch_desc": "Un sistema que piensa antes de responder.",
        "arch_controller": "🧠 Controlador Cerebral",
        "arch_layer_a": "CAPA A: Cerebro Rápido",
        "arch_layer_b": "CAPA B: Consenso Multi-Modelo",
        "arch_layer_c": "CAPA C: Cerebro Profundo"
    },
    "ja": { // Japanese
        "hero_badge": "システムオンライン & 進化中",
        "hero_brand": "VedSAAS",
        "hero_tagline": "世界初の <span class='text-gradient'>自己進化型</span> AI文明",
        "hero_subtitle": "古代の知恵（ヴェーダ）と現代の知性（SAAS）を融合。<br><span style='color: var(--accent-cyan);'>自己修復。意思決定。プライバシー優先。</span>",
        "btn_start": "会話を始める",
        "btn_explore": "脳を探求する",
        "arch_title": "3層の脳アーキテクチャ",
        "arch_desc": "答える前に考えるシステム。脳コントローラーによって調整されます。",
        "arch_controller": "🧠 脳コントローラー (司令塔)",
        "arch_layer_a": "レイヤー A: 高速脳 (Local)",
        "arch_layer_b": "レイヤー B: マルチモデル合意",
        "arch_layer_c": "レイヤー C: 深層脳 (Deep Compute)"
    }
};

async function initCivilization() {
    let visitorData = { city: "Unknown", region: "Unknown", country_name: "Unknown", country_code: "US", org: "Unknown" };
    let deviceData = getDeviceData();
    let selectedLang = localStorage.getItem('vedsaas_lang');

    try {
        // 1. Get Enhanced Visitor Data
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            visitorData = await response.json();

            // Intelligent Localization Logic
            if (!selectedLang) {
                const cc = visitorData.country_code;
                const region = (visitorData.region || '').toLowerCase();

                // 1. India Regional Logic
                if (cc === 'IN') {
                    if (region.includes('maharashtra')) selectedLang = 'mr';
                    else if (region.includes('bengal')) selectedLang = 'bn';
                    else if (region.includes('tamil')) selectedLang = 'en'; // Placeholder for TA
                    else selectedLang = 'hi'; // Default National
                }
                // 2. Global Logic
                else if (cc === 'FR') selectedLang = 'fr';
                else if (cc === 'ES' || cc === 'MX') selectedLang = 'es';
                else if (cc === 'JP') selectedLang = 'ja';
                else if (cc === 'DE') selectedLang = 'en'; // Placeholder for DE
                else selectedLang = 'en'; // Default Global
            }
        }
    } catch (e) {
        console.warn("Localization failed, using default.");
    } finally {
        // Fallback
        if (!selectedLang) selectedLang = 'en';

        applyLanguage(selectedLang);
        updateLangDropdown(selectedLang);

        // Extended Telemetry
        visitorData.screen_res = `${window.screen.width}x${window.screen.height}`;
        visitorData.browser_lang = navigator.language;
        visitorData.connection = navigator.connection ? navigator.connection.effectiveType : 'unknown';

        saveVisitorLog(visitorData, deviceData);

        // Expose for UI
        localStorage.setItem('vedsaas_session_data', JSON.stringify({ ...visitorData, ...deviceData }));
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

    return { type, os, ua, browser: getBrowserName(ua) };
}

function getBrowserName(ua) {
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    return "Unknown";
}

function applyLanguage(lang) {
    const texts = DICTIONARY[lang] || DICTIONARY['en'];
    if (!texts) return;

    localStorage.setItem('vedsaas_lang', lang);

    const setHtml = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
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

window.changeLanguage = function (lang) {
    applyLanguage(lang);
    updateLangDropdown(lang);
}

function updateLangDropdown(lang) { }

function saveVisitorLog(data, device) {
    const log = JSON.parse(localStorage.getItem('vedsaas_visitor_log') || '[]');
    log.push({
        timestamp: new Date().toISOString(),
        ip: data.ip || 'Hidden',
        city: data.city,
        region: data.region,
        country: data.country_name,
        device_type: device.type,
        os: device.os,
        browser: device.browser,
        res: data.screen_res
    });
    if (log.length > 50) log.shift();
    localStorage.setItem('vedsaas_visitor_log', JSON.stringify(log));
}

document.addEventListener('DOMContentLoaded', initCivilization);
