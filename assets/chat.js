/* ============================================================
   Plstka Assistant — self-contained chat widget
   Injects its own styles + DOM. Include on any page with:
       <script src="assets/chat.js"></script>

   Answering engine: local intent matching over a Plstka knowledge
   base (works offline, no API key, nothing to leak).
   To use a real LLM instead, implement CONFIG.remoteEndpoint —
   see callRemote() at the bottom. Never put an API key in this file;
   proxy it through your own server.
   ============================================================ */
(function () {
  'use strict';
  if (window.__plstkaChat) return;
  window.__plstkaChat = true;

  var CONFIG = {
    name: 'Plstka Assistant',
    status: 'Online · replies instantly',
    // Set to a URL of YOUR backend (which holds the API key) to use a real LLM.
    remoteEndpoint: null,
    storageKey: 'plstka-chat-v1',
    typingMs: [420, 900]
  };

  /* ---------------- Knowledge base ---------------- */
  var KB = [
    {
      id: 'greeting',
      k: ['hi', 'hello', 'hey', 'salam', 'ahlan', 'good morning', 'good evening', 'مرحبا', 'السلام'],
      a: "Hi! 👋 I'm the Plstka assistant. I can help with recycling pickups, points and rewards, which materials we accept, our coverage, or our business platform.<br><br>What would you like to know?",
      c: ['How does it work?', 'What can I recycle?', 'Which cities?', 'How do I earn points?']
    },
    {
      id: 'how',
      k: ['how does it work', 'how it works', 'how do i start', 'get started', 'process', 'steps', 'how to use', 'begin'],
      a: "It's four simple steps:<br><br><b>1. Collect</b> — set aside plastic, paper, metal and other recyclables at home.<br><b>2. Swap</b> — book a pickup in the app at a time that suits you.<br><b>3. Earn</b> — our handler weighs and verifies your items, then credits your points.<br><b>4. Redeem</b> — spend points on discounts from partner brands.<br><br>Pickup is completely free.",
      c: ['What can I recycle?', 'How do I earn points?', 'Is it free?']
    },
    {
      id: 'materials',
      k: ['what can i recycle', 'materials', 'accept', 'what do you take', 'plastic', 'paper', 'glass', 'metal', 'copper', 'steel', 'aluminum', 'aluminium', 'cans', 'cardboard', 'electronics', 'e-waste', 'ewaste', 'batteries'],
      a: "We accept <b>ten material streams</b>:<br><br>♻️ Plastic bottles &amp; jugs<br>📄 Paper &amp; cardboard<br>🥫 Cans, steel, copper &amp; aluminium<br>🍶 Glass<br>📱 Electronics / e-waste<br><br>Everything is weighed and priced per kilogram. You can see the full list on the <a href='products.html#materials'>Products page</a>.",
      c: ['How much are points worth?', 'How do I book a pickup?']
    },
    {
      id: 'cities',
      k: ['cities', 'city', 'where', 'available', 'coverage', 'location', 'area', 'tanta', 'mahalla', 'mansoura', 'shebin', 'cairo', 'alexandria', 'near me'],
      a: "We currently operate in <b>four Delta cities</b>:<br><br>📍 Tanta (head office &amp; sorting facility)<br>📍 El-Mahalla El-Kubra<br>📍 Mansoura<br>📍 Shebin El-Kom<br><br>Six more cities are planned. If you're outside these, message us via the <a href='contact.html'>contact page</a> and we'll notify you when we launch near you.",
      c: ['How do I book a pickup?', 'Contact support']
    },
    {
      id: 'points',
      k: ['points', 'earn', 'how many points', 'rewards value', 'worth', 'tier', 'platinum', 'leaderboard', 'competition'],
      a: "You earn points based on the <b>type and weight</b> of what we collect — heavier and higher-value materials (like copper or aluminium) earn more per kilogram.<br><br>As you recycle more you climb <b>tier levels</b>, which unlock better rates. There are also city leaderboards with monthly prizes.<br><br>A pickup request needs roughly <b>50 points' worth</b> of material so every trip is worthwhile.",
      c: ['What rewards can I get?', 'How do I book a pickup?']
    },
    {
      id: 'rewards',
      k: ['rewards', 'redeem', 'discount', 'voucher', 'coupon', 'prizes', 'what do i get', 'benefits'],
      a: "Points convert into vouchers across <b>six categories</b>:<br><br>🍔 Food &amp; beverage<br>🚑 Healthcare &amp; pharmacy<br>🚌 Transport &amp; fuel<br>🛒 Shopping &amp; retail<br>🎬 Entertainment<br>🎓 Education<br><br>The catalogue refreshes monthly — see <a href='products.html#rewards'>Rewards</a>.",
      c: ['How do I earn points?', 'Download the app']
    },
    {
      id: 'pickup',
      k: ['pickup', 'pick up', 'collection', 'schedule', 'book', 'appointment', 'collect my', 'when will you come', 'driver', 'handler'],
      a: "Booking a pickup takes a few taps:<br><br>1. Open the app and select what you're recycling<br>2. Choose a date and time window<br>3. Confirm your address<br><br>A handler comes to your door, weighs everything on the spot, and your points are credited immediately. <b>Pickup is free.</b><br><br>If a pickup didn't arrive, the in-app chat is fastest — or email <a href='mailto:support@plstka.com'>support@plstka.com</a>.",
      c: ['Which cities?', 'Is it free?', 'Contact support']
    },
    {
      id: 'free',
      k: ['free', 'do i pay', 'have to pay', 'pay anything', 'cost me', 'charge me', 'any fees', 'is there a fee'],
      a: "For households, Plstka is <b>completely free</b> — scheduling a pickup costs nothing. You only ever gain points and rewards.<br><br>Businesses use a paid platform (from $249/site/month) which includes collection logistics, the dashboard and ESG reporting.",
      c: ['Business pricing', 'How do I earn points?']
    },
    {
      id: 'download',
      k: ['download', 'app store', 'google play', 'install', 'get the app', 'ios', 'android', 'apk'],
      a: "You can get the Plstka app on <b>iOS and Android</b> — the download links are in the footer of any page, or on the <a href='products.html'>Products page</a>.<br><br>Sign up takes under a minute and you can book your first pickup right away.",
      c: ['How does it work?', 'Which cities?']
    },
    {
      id: 'business',
      k: ['business', 'company', 'enterprise', 'b2b', 'factory', 'commercial', 'corporate', 'platform', 'saas', 'iot', 'demo'],
      a: "<b>Plstka for Business</b> is our waste intelligence platform. It gives companies:<br><br>• IoT smart bins with fill-level sensors<br>• AI route &amp; pickup optimisation<br>• Live analytics on volume, diversion and recovery value<br>• Audit-ready ESG reporting (GRI 306 / CDP aligned)<br>• API &amp; ERP integration<br>• A vetted recycler marketplace<br><br>Clients typically see ~32% lower disposal cost. <a href='plstka-business.html'>Explore the platform</a> or book a demo.",
      c: ['Business pricing', 'ESG reporting', 'Book a demo']
    },
    {
      id: 'pricing',
      k: ['pricing', 'price', 'prices', 'plan', 'plans', 'business plan', 'business pricing', 'how much does it cost', 'quote', 'starter', 'growth', 'tiers', 'per site', 'per month', 'monthly cost'],
      a: "Business plans (indicative — final quotes depend on volume and site count):<br><br><b>Starter</b> — $249/site/mo · 1 site, up to 3 streams<br><b>Growth</b> — $749/site/mo · up to 10 sites, IoT sensors, ESG reporting<br><b>Enterprise</b> — custom · unlimited sites, API, SLAs, SSO<br><br>See <a href='plstka-business.html#pricing'>full pricing</a>. For households the service is free.",
      c: ['Book a demo', 'What is the platform?']
    },
    {
      id: 'esg',
      k: ['esg', 'gri', 'cdp', 'reporting', 'compliance', 'audit', 'sustainability report', 'chain of custody', 'certificate', 'co2', 'carbon'],
      a: "Our ESG reporting is built for auditors, not marketing:<br><br>• GRI 306 and CDP-aligned waste disclosures<br>• Digital certificates from every licensed recycler<br>• CO₂ avoidance calculated per stream and site<br>• Immutable audit trail from bin to weighbridge<br><br>Every kilogram is weighed and timestamped, so claims are backed by records rather than estimates. <a href='plstka-business.html#esg'>More on ESG</a>.",
      c: ['Business pricing', 'Book a demo']
    },
    {
      id: 'demo',
      k: ['book a demo', 'demo', 'sales', 'talk to sales', 'consultation', 'meeting'],
      a: "Happy to set that up. A demo is a <b>30-minute walkthrough</b> using your own waste profile, plus an estimate of what you could recover and a 30-day pilot plan — no commitment.<br><br>Book it on the <a href='plstka-business.html#demo'>business page</a>, or email <a href='mailto:business@plstka.com'>business@plstka.com</a>.",
      c: ['Business pricing', 'What is the platform?']
    },
    {
      id: 'partner',
      k: ['partner', 'partnership', 'brand', 'collaborate', 'recycler', 'supplier', 'sponsor', 'school', 'ngo'],
      a: "There are three ways to partner with us:<br><br><b>Reward partners</b> — brands offering discounts in our catalogue (you pay only on redemption)<br><b>Recycling partners</b> — licensed recyclers buying sorted, documented material<br><b>Programs</b> — schools, NGOs and municipalities running recycling drives<br><br>Details and an application form are on the <a href='partners.html'>Partners page</a>, or email <a href='mailto:partners@plstka.com'>partners@plstka.com</a>.",
      c: ['Contact support', 'About Plstka']
    },
    {
      id: 'careers',
      k: ['job', 'jobs', 'career', 'careers', 'hiring', 'vacancy', 'work with you', 'apply', 'internship', 'role'],
      a: "We're hiring! There are currently <b>7 open roles</b> across engineering, operations, growth and sustainability — including backend, mobile and data science.<br><br>See them all on the <a href='careers.html'>Careers page</a>. Nothing matching? Email <a href='mailto:careers@plstka.com'>careers@plstka.com</a> — we read every note.",
      c: ['About Plstka', 'Contact support']
    },
    {
      id: 'about',
      k: ['about', 'who are you', 'company', 'story', 'founded', 'mission', 'history', 'impact', 'stats'],
      a: "Plstka is an <b>AI-powered recycling platform</b> founded in 2021 in Egypt's Delta region.<br><br>Our impact so far:<br>• 60,000+ active users<br>• 1,500+ tons recycled<br>• 2.4M+ items processed<br>• 840 tons of CO₂ avoided<br>• 4 cities, 6 more planned<br><br>Read the full story on the <a href='about.html'>About page</a>.",
      c: ['Which cities?', 'How does it work?', 'Careers']
    },
    {
      id: 'contact',
      k: ['contact', 'support', 'help', 'phone', 'email', 'talk to someone', 'human', 'agent', 'complaint', 'problem', 'issue'],
      a: "Here's how to reach a real person:<br><br>💬 <b>App support</b> — <a href='mailto:support@plstka.com'>support@plstka.com</a><br>💼 <b>Business</b> — <a href='mailto:business@plstka.com'>business@plstka.com</a><br>🤝 <b>Partnerships</b> — <a href='mailto:partners@plstka.com'>partners@plstka.com</a><br>📰 <b>Press</b> — <a href='mailto:press@plstka.com'>press@plstka.com</a><br><br>📞 +20 100 000 0000<br>🕘 Sun–Thu 9:00–18:00 EET<br><br>Or use the form on the <a href='contact.html'>contact page</a>.",
      c: ['Which cities?', 'How does it work?']
    },
    {
      id: 'thanks',
      k: ['thanks', 'thank you', 'shukran', 'appreciate', 'great', 'awesome', 'perfect', 'شكرا'],
      a: "You're very welcome! 🌱 Anything else I can help with?",
      c: ['How does it work?', 'What can I recycle?', 'Contact support']
    },
    {
      id: 'bye',
      k: ['bye', 'goodbye', 'see you', 'later', 'thats all', "that's all"],
      a: "Thanks for chatting — happy recycling! ♻️ Come back any time.",
      c: ['Download the app']
    }
  ];

  var FALLBACK = {
    a: "I'm not sure I caught that one. I can help with:<br><br>• How Plstka works and booking a pickup<br>• Which materials we accept<br>• Points, tiers and rewards<br>• Cities we cover<br>• Our business platform, pricing and ESG reporting<br>• Careers, partnerships and contact details<br><br>For anything else, our team is at <a href='mailto:hello@plstka.com'>hello@plstka.com</a>.",
    c: ['How does it work?', 'What can I recycle?', 'Business platform', 'Contact support']
  };

  /* ---------------- Matching engine ---------------- */
  function normalise(s) {
    return (' ' + s.toLowerCase() + ' ')
      .replace(/[^\w\s؀-ۿ']/g, ' ')
      .replace(/\s+/g, ' ');
  }
  function match(query) {
    var q = normalise(query), best = null, bestScore = 0;
    KB.forEach(function (intent) {
      var score = 0;
      intent.k.forEach(function (kw) {
        var k = normalise(kw).trim();
        if (!k) return;
        if (q.indexOf(' ' + k + ' ') !== -1) {
          // longer / multi-word phrases are stronger signals
          score += k.indexOf(' ') !== -1 ? k.split(' ').length * 3 : 2;
        }
      });
      if (score > bestScore) { bestScore = score; best = intent; }
    });
    return bestScore >= 2 ? best : null;
  }

  /* ---------------- Styles ---------------- */
  var css = ''
  + '.pk-fab{position:fixed;right:28px;bottom:28px;z-index:9998;width:64px;height:64px;border:none;border-radius:999px;background:#FFD236;box-shadow:0 8px 26px rgba(0,0,0,.22);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}'
  + '.pk-fab:hover{transform:scale(1.07);box-shadow:0 12px 32px rgba(0,0,0,.28)}'
  + '.pk-fab svg{width:28px;height:28px}'
  + '.pk-fab .pk-x{display:none}.pk-open .pk-fab .pk-x{display:block}.pk-open .pk-fab .pk-bub{display:none}'
  + '.pk-dot{position:absolute;top:4px;right:4px;width:14px;height:14px;border-radius:50%;background:#00AE63;border:2.5px solid #fff}'
  + '.pk-open .pk-dot{display:none}'
  + '.pk-panel{position:fixed;right:28px;bottom:104px;z-index:9999;width:384px;max-width:calc(100vw - 32px);height:576px;max-height:calc(100vh - 140px);background:#fff;border-radius:22px;box-shadow:0 24px 70px rgba(5,60,51,.28);display:flex;flex-direction:column;overflow:hidden;opacity:0;visibility:hidden;transform:translateY(14px) scale(.97);transition:opacity .22s,transform .22s,visibility .22s;font-family:Poppins,system-ui,sans-serif}'
  + '.pk-open .pk-panel{opacity:1;visibility:visible;transform:none}'
  + '.pk-head{background:linear-gradient(180deg,#00AE63 40%,#00AE8B 100%);color:#fff;padding:18px 18px;display:flex;align-items:center;gap:12px;flex:none}'
  + '.pk-av{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}'
  + '.pk-head b{display:block;font-size:15px;font-weight:600;line-height:1.3}'
  + '.pk-head small{font-size:11.5px;opacity:.85;display:flex;align-items:center;gap:5px}'
  + '.pk-head small i{width:6px;height:6px;border-radius:50%;background:#9BF6C8;display:inline-block}'
  + '.pk-head .pk-close{margin-left:auto;background:rgba(255,255,255,.16);border:none;width:32px;height:32px;border-radius:50%;color:#fff;cursor:pointer;font-size:17px;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .2s}'
  + '.pk-head .pk-close:hover{background:rgba(255,255,255,.3)}'
  + '.pk-body{flex:1;overflow-y:auto;padding:18px;background:#FAFAFA;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}'
  + '.pk-msg{display:flex;gap:8px;align-items:flex-end;max-width:88%}'
  + '.pk-msg.bot{align-self:flex-start}.pk-msg.me{align-self:flex-end;flex-direction:row-reverse}'
  + '.pk-msg .ic{width:28px;height:28px;border-radius:50%;background:linear-gradient(180deg,#00AE63,#00AE8B);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none}'
  + '.pk-msg.me .ic{background:#053C33}'
  + '.pk-bubble{padding:12px 15px;border-radius:16px;font-size:14px;line-height:1.6;word-wrap:break-word}'
  + '.pk-msg.bot .pk-bubble{background:#fff;color:#053C33;border:1px solid rgba(5,60,51,.08);border-bottom-left-radius:5px;box-shadow:0 2px 8px rgba(5,60,51,.05)}'
  + '.pk-msg.me .pk-bubble{background:linear-gradient(180deg,#00AE63,#00AE8B);color:#fff;border-bottom-right-radius:5px}'
  + '.pk-bubble a{color:#008667;font-weight:600;text-decoration:underline}'
  + '.pk-msg.me .pk-bubble a{color:#fff}'
  + '.pk-typing{display:flex;gap:4px;padding:14px 16px}'
  + '.pk-typing i{width:7px;height:7px;border-radius:50%;background:#00AE63;opacity:.4;animation:pkb 1.2s infinite}'
  + '.pk-typing i:nth-child(2){animation-delay:.18s}.pk-typing i:nth-child(3){animation-delay:.36s}'
  + '@keyframes pkb{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}'
  + '.pk-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 18px 12px;background:#FAFAFA;flex:none}'
  + '.pk-chip{background:#fff;border:1px solid rgba(0,174,99,.35);color:#008667;font-family:inherit;font-size:12.5px;font-weight:500;padding:8px 13px;border-radius:999px;cursor:pointer;transition:background .18s,transform .18s}'
  + '.pk-chip:hover{background:#00AE63;color:#fff;transform:translateY(-1px)}'
  + '.pk-foot{padding:12px 14px;border-top:1px solid rgba(5,60,51,.08);background:#fff;flex:none}'
  + '.pk-form{display:flex;gap:8px;align-items:center}'
  + '.pk-form input{flex:1;min-width:0;border:1px solid rgba(5,60,51,.12);background:#FAFAFA;border-radius:999px;padding:12px 16px;font-family:inherit;font-size:14px;outline:none;color:#053C33;transition:border-color .2s,background .2s}'
  + '.pk-form input:focus{background:#fff;border-color:rgba(0,174,99,.5);box-shadow:0 0 0 3px rgba(0,174,99,.12)}'
  + '.pk-form button{width:42px;height:42px;flex:none;border:none;border-radius:50%;background:#FFD236;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .18s}'
  + '.pk-form button:hover{transform:translateY(-2px)}'
  + '.pk-form button svg{width:18px;height:18px}'
  + '.pk-note{text-align:center;font-size:10.5px;color:#9aa0a6;margin-top:8px}'
  + '@media(max-width:520px){.pk-panel{right:0;bottom:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0}.pk-fab{right:18px;bottom:18px}}'
  + '@media(prefers-reduced-motion:reduce){.pk-panel,.pk-fab,.pk-chip,.pk-form button{transition:none}.pk-typing i{animation:none}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------- DOM ---------------- */
  var wrap = document.createElement('div');
  wrap.innerHTML = ''
    + '<button class="pk-fab" id="pkFab" aria-label="Open chat assistant" aria-expanded="false">'
      + '<span class="pk-dot"></span>'
      + '<svg class="pk-bub" viewBox="0 0 24 24" fill="none" stroke="#053C33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l2-5.2A8.38 8.38 0 0 1 12 3a8.38 8.38 0 0 1 9 8.5z"/></svg>'
      + '<svg class="pk-x" viewBox="0 0 24 24" fill="none" stroke="#053C33" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
    + '</button>'
    + '<div class="pk-panel" id="pkPanel" role="dialog" aria-label="Plstka assistant" aria-modal="false">'
      + '<div class="pk-head">'
        + '<span class="pk-av">♻️</span>'
        + '<div><b>' + CONFIG.name + '</b><small><i></i>' + CONFIG.status + '</small></div>'
        + '<button class="pk-close" id="pkClose" aria-label="Close chat">✕</button>'
      + '</div>'
      + '<div class="pk-body" id="pkBody" role="log" aria-live="polite"></div>'
      + '<div class="pk-chips" id="pkChips"></div>'
      + '<div class="pk-foot">'
        + '<form class="pk-form" id="pkForm">'
          + '<input id="pkInput" type="text" placeholder="Ask me anything…" autocomplete="off" aria-label="Type your message" />'
          + '<button type="submit" aria-label="Send message"><svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>'
        + '</form>'
        + '<p class="pk-note">Automated assistant · for anything else, contact our team</p>'
      + '</div>'
    + '</div>';
  document.body.appendChild(wrap);

  var fab = document.getElementById('pkFab');
  var panel = document.getElementById('pkPanel');
  var body = document.getElementById('pkBody');
  var chips = document.getElementById('pkChips');
  var form = document.getElementById('pkForm');
  var input = document.getElementById('pkInput');

  // Any pre-existing static FAB on the page would duplicate ours
  document.querySelectorAll('.chat-fab').forEach(function (el) { el.style.display = 'none'; });

  /* ---------------- Rendering ---------------- */
  var history = [];

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addMsg(who, html, save) {
    var row = document.createElement('div');
    row.className = 'pk-msg ' + who;
    var ic = document.createElement('span');
    ic.className = 'ic';
    ic.textContent = who === 'bot' ? '♻️' : '🙂';
    var bub = document.createElement('div');
    bub.className = 'pk-bubble';
    if (who === 'bot') bub.innerHTML = html;   // authored content only
    else bub.textContent = html;               // user input escaped
    row.appendChild(ic); row.appendChild(bub);
    body.appendChild(row);
    scrollDown();
    if (save !== false) { history.push({ w: who, t: html }); persist(); }
  }

  function showTyping() {
    var row = document.createElement('div');
    row.className = 'pk-msg bot';
    row.id = 'pkTyping';
    row.innerHTML = '<span class="ic">♻️</span><div class="pk-bubble pk-typing"><i></i><i></i><i></i></div>';
    body.appendChild(row);
    scrollDown();
  }
  function hideTyping() {
    var t = document.getElementById('pkTyping');
    if (t) t.remove();
  }

  function setChips(list) {
    chips.innerHTML = '';
    (list || []).forEach(function (label) {
      var b = document.createElement('button');
      b.className = 'pk-chip';
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function () { send(label); });
      chips.appendChild(b);
    });
  }

  function persist() {
    try { sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(history.slice(-40))); } catch (e) {}
  }
  function restore() {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(CONFIG.storageKey) || 'null'); } catch (e) {}
    if (saved && saved.length) {
      saved.forEach(function (m) { addMsg(m.w, m.t, false); });
      history = saved;
      return true;
    }
    return false;
  }

  /* ---------------- Conversation ---------------- */
  function reply(text) {
    var delay = CONFIG.typingMs[0] + Math.random() * (CONFIG.typingMs[1] - CONFIG.typingMs[0]);
    showTyping();
    var done = function (res) {
      hideTyping();
      addMsg('bot', res.a);
      setChips(res.c);
    };
    if (CONFIG.remoteEndpoint) {
      callRemote(text).then(done).catch(function () {
        done({ a: "I couldn't reach the assistant service just now. Please try again, or email <a href='mailto:hello@plstka.com'>hello@plstka.com</a>.", c: FALLBACK.c });
      });
      return;
    }
    setTimeout(function () { done(match(text) || FALLBACK); }, delay);
  }

  function send(text) {
    text = (text || '').trim();
    if (!text) return;
    addMsg('me', text);
    setChips([]);
    input.value = '';
    reply(text);
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });

  function toggle(open) {
    var isOpen = typeof open === 'boolean' ? open : !document.body.classList.contains('pk-open');
    document.body.classList.toggle('pk-open', isOpen);
    fab.setAttribute('aria-expanded', String(isOpen));
    fab.setAttribute('aria-label', isOpen ? 'Close chat assistant' : 'Open chat assistant');
    if (isOpen) {
      if (!history.length && !restore()) {
        var g = KB[0];
        addMsg('bot', g.a);
        setChips(g.c);
      } else if (!chips.children.length) {
        setChips(FALLBACK.c);
      }
      setTimeout(function () { input.focus(); }, 260);
      scrollDown();
    }
  }

  fab.addEventListener('click', function () { toggle(); });
  document.getElementById('pkClose').addEventListener('click', function () { toggle(false); fab.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('pk-open')) { toggle(false); fab.focus(); }
  });

  /* ---------------- Optional real-LLM hook ----------------
     Point CONFIG.remoteEndpoint at YOUR backend (which stores the
     API key server-side) and it will be used instead of the local KB.
     Expected response: { "reply": "…", "suggestions": ["…"] }
  --------------------------------------------------------- */
  function callRemote(text) {
    return fetch(CONFIG.remoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: history.slice(-10).map(function (m) {
          return { role: m.w === 'me' ? 'user' : 'assistant', content: m.t };
        })
      })
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { return { a: d.reply, c: d.suggestions || FALLBACK.c }; });
  }

  window.PlstkaChat = { open: function () { toggle(true); }, close: function () { toggle(false); }, config: CONFIG };
})();
