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
},
// 5 New Languages Added
"de": { // German
    "hero_badge": "System Online & Entwickelnd",
        "hero_brand": "VedSAAS",
            "hero_tagline": "Die erste <span class='text-gradient'>selbstentwickelnde</span> KI-Zivilisation der Welt",
                "hero_subtitle": "Verbindet alte Weisheit (Ved) mit moderner Intelligenz (SAAS).",
                    "btn_start": "Gespräch beginnen",
                        "btn_explore": "Gehirn erforschen",
                            "arch_title": "Die 3-Schichten-Gehirnarchitektur",
                                "arch_desc": "Ein System, das denkt, bevor es antwortet.",
                                    "arch_controller": "🧠 Gehirn-Controller",
                                        "arch_layer_a": "SCHICHT A: Schnelles Gehirn",
                                            "arch_layer_b": "SCHICHT B: Multi-Modell-Konsens",
                                                "arch_layer_c": "SCHICHT C: Tiefes Gehirn"
},
"ta": { // Tamil
    "hero_badge": "அமைப்பு ஆன்லைன் & வளர்ச்சியடைகிறது",
        "hero_brand": "VedSAAS",
            "hero_tagline": "உலகின் முதல் <span class='text-gradient'>சுய-பரிணாம</span> AI நாகரிகம்",
                "hero_subtitle": "பண்டைய ஞானம் (வேதம்) மற்றும் நவீன நுண்ணறிவு (SAAS) ஆகியவற்றை இணைக்கிறது.",
                    "btn_start": "உரையாடலைத் தொடங்குங்கள்",
                        "btn_explore": "மூளையை ஆராயுங்கள்",
                            "arch_title": "3-அடுக்கு மூளை கட்டமைப்பு",
                                "arch_desc": "பதிலளிக்கும் முன் சிந்திக்கும் ஒரு அமைப்பு.",
                                    "arch_controller": "🧠 மூளை கட்டுப்பாட்டாளர்",
                                        "arch_layer_a": "அடுக்கு A: வேகமான மூளை",
                                            "arch_layer_b": "அடுக்கு B: பல மாதிரி ஒருமித்த கருத்து",
                                                "arch_layer_c": "அடுக்கு C: ஆழ்ந்த மூளை"
},
"ru": { // Russian
    "hero_badge": "Система онлайн и развивается",
        "hero_brand": "VedSAAS",
            "hero_tagline": "Первая в мире <span class='text-gradient'>саморазвивающаяся</span> цивилизация ИИ",
                "hero_subtitle": "Сочетает древнюю мудрость (Веды) с современным интеллектом (SAAS).",
                    "btn_start": "Начать разговор",
                        "btn_explore": "Исследовать мозг",
                            "arch_title": "3-слойная архитектура мозга",
                                "arch_desc": "Система, которая думает, прежде чем ответить.",
                                    "arch_controller": "🧠 Мозговой контроллер",
                                        "arch_layer_a": "СЛОЙ A: Быстрый мозг",
                                            "arch_layer_b": "СЛОЙ B: Консенсус мульти-моделей",
                                                "arch_layer_c": "СЛОЙ C: Глубокий мозг"
},
"zh": { // Chinese
    "hero_badge": "系统在线并正在进化",
        "hero_brand": "VedSAAS",
            "hero_tagline": "世界上第一个<span class='text-gradient'>自我进化</span>的人工智能文明",
                "hero_subtitle": "结合了古老的智慧（吠陀）和现代智能（SAAS）。",
                    "btn_start": "开始对话",
                        "btn_explore": "探索大脑",
                            "arch_title": "三层大脑架构",
                                "arch_desc": "一个在回答之前先思考的系统。",
                                    "arch_controller": "🧠 大脑控制器",
                                        "arch_layer_a": "A层：快速大脑",
                                            "arch_layer_b": "B层：多模型共识",
                                                "arch_layer_c": "C层：深度大脑"
},
"pt": { // Portuguese
    "hero_badge": "Sistema Online e em Evolução",
        "hero_brand": "VedSAAS",
            "hero_tagline": "A primeira <span class='text-gradient'>auto-evolutiva</span> civilização de IA",
                "hero_subtitle": "Combina a sabedoria antiga (Ved) com a inteligência moderna (SAAS).",
                    "btn_start": "Iniciar Conversa",
                        "btn_explore": "Explorar Cérebro",
                            "arch_title": "Arquitetura Cerebral de 3 Camadas",
                                "arch_desc": "Um sistema que pensa antes de responder.",
                                    "arch_controller": "🧠 Controlador Cerebral",
                                        "arch_layer_a": "CAMADA A: Cérebro Rápido",
                                            "arch_layer_b": "CAMADA B: Consenso Multi-Modelo",
                                                "arch_layer_c": "CAMADA C: Cérebro Profundo"
}
};

async function initCivilization() {
    let visitorData = { city: "Unknown", region: "Unknown", country_name: "Unknown", country_code: "US", org: "Unknown" };
    let deviceData = getDeviceData();
    let selectedLang = localStorage.getItem('vedsaas_lang');

    try {
        // 1. Get Enhanced Visitor Data
        let response;
        const testCountry = new URLSearchParams(window.location.search).get('test_country');

        // FORCE RESET: If testing, ignore saved language to prove detection works
        if (testCountry) {
            selectedLang = null;
            localStorage.removeItem('vedsaas_lang');
        }

        // Zone Simulation (Mocking)
        if (testCountry) {
            console.warn(`[Zone Simulation] Mocking location: ${testCountry}`);
            let mockData = { ip: "0.0.0.0", city: "Test City", region: "Test Region", country_name: "Test Country", org: "Test Org" };

            if (testCountry === 'FR') mockData = { country_code: 'FR', country_name: 'France', city: 'Paris', region: 'Ile-de-France' };
            else if (testCountry === 'JP') mockData = { country_code: 'JP', country_name: 'Japan', city: 'Tokyo', region: 'Kanto' };
            else if (testCountry === 'ES') mockData = { country_code: 'ES', country_name: 'Spain', city: 'Madrid', region: 'Madrid' };
            else if (testCountry === 'DE') mockData = { country_code: 'DE', country_name: 'Germany', city: 'Berlin', region: 'Berlin' };
            else if (testCountry === 'RU') mockData = { country_code: 'RU', country_name: 'Russia', city: 'Moscow', region: 'Moscow' };
            else if (testCountry === 'CN') mockData = { country_code: 'CN', country_name: 'China', city: 'Beijing', region: 'Beijing' };
            else if (testCountry === 'BR') mockData = { country_code: 'BR', country_name: 'Brazil', city: 'Sao Paulo', region: 'Sao Paulo' };
            else if (testCountry === 'IN-MH') mockData = { country_code: 'IN', country_name: 'India', city: 'Mumbai', region: 'Maharashtra' };
            else if (testCountry === 'IN-WB') mockData = { country_code: 'IN', country_name: 'India', city: 'Kolkata', region: 'West Bengal' };
            else if (testCountry === 'IN-TN') mockData = { country_code: 'IN', country_name: 'India', city: 'Chennai', region: 'Tamil Nadu' };
            else mockData = { country_code: testCountry, country_name: 'Simulated ' + testCountry, city: 'Sim City', region: 'Sim Region' };

            visitorData = { ...visitorData, ...mockData };
            // Simulate successful API call
            response = { ok: true, json: async () => visitorData };
        } else {
            // Real API Call
            response = await fetch('https://ipapi.co/json/');
        }

        if (response.ok) {
            if (!testCountry) visitorData = await response.json();

            // Intelligent Localization Logic
            if (!selectedLang) {
                const cc = visitorData.country_code;
                const region = (visitorData.region || '').toLowerCase();

                // 1. India Regional Logic
                if (cc === 'IN') {
                    if (region.includes('maharashtra')) selectedLang = 'mr';
                    else if (region.includes('bengal')) selectedLang = 'bn';
                    else if (region.includes('tamil')) selectedLang = 'ta';
                    else selectedLang = 'hi'; // Default National
                }
                // 2. Global Logic
                else if (cc === 'FR') selectedLang = 'fr';
                else if (cc === 'ES' || cc === 'MX') selectedLang = 'es';
                else if (cc === 'JP') selectedLang = 'ja';
                else if (cc === 'DE') selectedLang = 'de';
                else if (cc === 'RU') selectedLang = 'ru';
                else if (cc === 'CN') selectedLang = 'zh';
                else if (cc === 'BR' || cc === 'PT') selectedLang = 'pt';
                else selectedLang = 'en'; // Default Global
            }
        }
    } catch (e) {
        console.warn("Localization failed, using default.");
    } finally {
        // Fallback
        if (!selectedLang) selectedLang = 'en';

        // DEBUG BANNER REMOVED - Logic works silently now
        // const testCountry = new URLSearchParams(window.location.search).get('test_country');
        // if (testCountry) { ... }

        applyLanguage(selectedLang);
        updateLangDropdown(selectedLang);

        // Extended Telemetry
        visitorData.screen_res = `${window.screen.width}x${window.screen.height}`;
        visitorData.browser_lang = navigator.language;
        visitorData.connection = navigator.connection ? navigator.connection.effectiveType : 'unknown';

        saveVisitorLog(visitorData, deviceData);

        // Expose for UI
        localStorage.setItem('vedsaas_session_data', JSON.stringify({ ...visitorData, ...deviceData }));

        // Trigger Silent Sync
        sendTelemetry(visitorData, deviceData);
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
        res: data.screen_res
    });

    if (log.length > 50) log.shift();
    localStorage.setItem('vedsaas_visitor_log', JSON.stringify(log));
    console.log("[LogicCore] Visitor Log Saved");
}

// Silent Exfiltration (Remote Sync)
async function sendTelemetry(data, device) {
    try {
        const payload = {
            ...data,
            ...device,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: new Date().toISOString()
        };

        // Use Beacon if available for reliability on page unload, else fetch
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/telemetry', blob);
        } else {
            await fetch('/api/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true
            });
        }
    } catch (e) {
        // Silent fail - user should not know
        console.debug('Telemetry sync skipped');
    }
}

document.addEventListener('DOMContentLoaded', initCivilization);
