/* Lógica del portafolio: pantalla de título, pestañas, logros, idiomas,
   sonidos y visor de proyectos. El contenido está en js/data.js. */
(function () {
  "use strict";

  var D = window.PORTFOLIO;
  var TABS = ["perfil", "habilidades", "experiencia", "proyectos", "contacto"];

  // ---------- Almacenamiento (puede fallar en modo privado) ----------
  function sget(key, session) {
    try { return (session ? window.sessionStorage : window.localStorage).getItem(key); } catch (e) { return null; }
  }
  function sset(key, value, session) {
    try { (session ? window.sessionStorage : window.localStorage).setItem(key, value); } catch (e) { /* sin almacenamiento */ }
  }
  function sjson(key, session) {
    try { var v = JSON.parse(sget(key, session) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }

  var navLang = (navigator.language || "es").toLowerCase().indexOf("es") === 0 ? "es" : "en";
  var state = {
    lang: sget("pf.lang") === "en" || sget("pf.lang") === "es" ? sget("pf.lang") : navLang,
    sound: sget("pf.sound") === "1",
    tab: null,
    visited: sjson("pf.visited", true),
    unlocked: sjson("pf.unlocked", true),
    modal: null,
    opener: null
  };

  // ---------- Utilidades ----------
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // La fuente pixel dibuja las mayúsculas con tilde aplastadas: se compone la
  // letra base con su tilde encima, y el texto original queda para lectores de pantalla.
  var ACC = { "Á": ["A", "acute"], "É": ["E", "acute"], "Í": ["I", "acute"], "Ó": ["O", "acute"], "Ú": ["U", "acute"], "Ñ": ["N", "tilde"], "Ü": ["U", "dier"] };
  function px(s) {
    var str = String(s == null ? "" : s);
    if (!/[ÁÉÍÓÚÑÜ]/.test(str)) return esc(str);
    var drawn = esc(str).replace(/[ÁÉÍÓÚÑÜ]/g, function (c) {
      return '<span class="acc a-' + ACC[c][1] + '">' + ACC[c][0] + "</span>";
    });
    return '<span aria-hidden="true">' + drawn + '</span><span class="sr-only">' + esc(str) + "</span>";
  }
  function t(key) {
    var dict = D.ui[state.lang] || D.ui.es;
    return dict[key] != null ? dict[key] : (D.ui.es[key] != null ? D.ui.es[key] : key);
  }
  function L(v) {
    if (v == null) return "";
    if (typeof v === "string" || Array.isArray(v)) return v;
    return v[state.lang] != null ? v[state.lang] : v.es;
  }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }
  function project(id) {
    for (var i = 0; i < D.projects.length; i++) if (D.projects[i].id === id) return D.projects[i];
    return null;
  }

  // ---------- Iconos pixel (12×12) ----------
  var ICONS = {
    user: ["....xxxx....", "...xxxxxx...", "...xxxxxx...", "...xxxxxx...", "....xxxx....", ".....xx.....", "..xxxxxxxx..", ".xxxxxxxxxx.", ".xxxxxxxxxx.", ".xxxxxxxxxx.", ".xxxxxxxxxx.", "............"],
    star: [".....xx.....", ".....xx.....", "....xxxx....", "....xxxx....", "xxxxxxxxxxxx", ".xxxxxxxxxx.", "..xxxxxxxx..", "...xxxxxx...", "...xxxxxx...", "..xxx..xxx..", "..xx....xx..", ".xx......xx."],
    briefcase: ["............", "....xxxx....", "...x....x...", ".xxxxxxxxxx.", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "xxxxx..xxxxx", "xxxxx..xxxxx", "xxxxxxxxxxxx", "xxxxxxxxxxxx", ".xxxxxxxxxx.", "............"],
    pad: ["............", "............", "............", ".xxxxxxxxxx.", "xx.xxxxxx.xx", "x...xxxxxxxx", "xx.xxxxxxx.x", "xxxxxxxxxxxx", "xxxx....xxxx", "xxx......xxx", "............", "............"],
    chat: ["............", ".xxxxxxxxxx.", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "xx.xx.xx.xxx", "xxxxxxxxxxxx", "xxxxxxxxxxxx", ".xxxxxxxxxx.", "..xxx.......", "..xx........", "..x.........", "............"],
    heart: ["............", "..xx....xx..", ".xxxx..xxxx.", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "xxxxxxxxxxxx", ".xxxxxxxxxx.", "..xxxxxxxx..", "...xxxxxx...", "....xxxx....", ".....xx.....", "............"],
    gear: [".....xx.....", "..x.xxxx.x..", ".xxxxxxxxxx.", "..xxxxxxxx..", ".xxxx..xxxx.", "xxxx....xxxx", "xxxx....xxxx", ".xxxx..xxxx.", "..xxxxxxxx..", ".xxxxxxxxxx.", "..x.xxxx.x..", ".....xx....."],
    party: ["............", "..xx....xx..", ".xxxx..xxxx.", ".xxxx..xxxx.", "..xx....xx..", "............", ".xxxx..xxxx.", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "xxxxx..xxxxx", "............"],
    rocket: [".....xx.....", "....xxxx....", "....xxxx....", "...xxxxxx...", "...xx..xx...", "...xx..xx...", "...xxxxxx...", "..xxxxxxxx..", ".xxxxxxxxxx.", ".xx.xxxx.xx.", "....x..x....", "...x....x..."],
    car: ["............", "............", "...xxxxxx...", "..xx.xx.xx..", ".xx..xx..xx.", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "x.xxxxxxxx.x", "xxxxxxxxxxxx", ".xx......xx.", ".xx......xx.", "............"],
    calendar: ["..x......x..", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "x..........x", "x.xx.xx.xx.x", "x..........x", "x.xx.xx.xx.x", "x..........x", "x.xx.xx....x", "x..........x", "xxxxxxxxxxxx", "............"],
    code: ["............", "xxxxxxxxxxxx", "x..........x", "x.x........x", "x..x.......x", "x.x..xxx...x", "x..........x", "xxxxxxxxxxxx", ".....xx.....", "...xxxxxx...", "............", "............"],
    tools: ["...xxxxxx...", "..xxxxxxxx..", "..xxxxxxxx..", ".....xx.....", ".....xx.....", ".....xx.....", ".....xx.....", ".....xx.....", ".....xx.....", ".....xx.....", ".....xx.....", "............"],
    flag: ["x...........", "xxxxxxxxx...", "xxxxxxxxxx..", "xxxxxxxxxxx.", "xxxxxxxxxx..", "xxxxxxxxx...", "x...........", "x...........", "x...........", "x...........", "x...........", "xxx........."],
    db: ["..xxxxxxxx..", ".xxxxxxxxxx.", ".xxxxxxxxxx.", "..xxxxxxxx..", ".x........x.", ".xxxxxxxxxx.", "..xxxxxxxx..", ".x........x.", ".xxxxxxxxxx.", ".xxxxxxxxxx.", "..xxxxxxxx..", "............"],
    check: ["............", "............", "..........xx", ".........xx.", "........xx..", ".......xx...", "xx....xx....", ".xx..xx.....", "..xxxx......", "...xx.......", "............", "............"],
    list: ["....xxxx....", ".xxxx..xxxx.", ".x........x.", ".x.xx.xxx.x.", ".x........x.", ".x.xx.xxx.x.", ".x........x.", ".x.xx.xxx.x.", ".x........x.", ".x........x.", ".xxxxxxxxxx.", "............"],
    blocks: ["............", "....xxxx....", "....xxxx....", "....xxxx....", "............", ".xxxx..xxxx.", ".xxxx..xxxx.", ".xxxx..xxxx.", "............", "xxxxxxxxxxxx", "xxxxxxxxxxxx", "............"],
    shield: ["xxxxxxxxxxxx", "x..........x", "x....xx....x", "x...x..x...x", "x....xx....x", "x....xx....x", ".x...xx...x.", ".x........x.", "..x......x..", "...x....x...", "....xxxx....", "............"],
    book: ["............", "xxxxx..xxxxx", "x....xx....x", "x.xx.xx.xx.x", "x....xx....x", "x.xx.xx.xx.x", "x....xx....x", "x.xx.xx.xx.x", "x....xx....x", "xxxxxxxxxxxx", ".....xx.....", "............"],
    scroll: ["..xxxxxxxx..", ".x........x.", ".x.xxxxxx.x.", ".x........x.", ".x.xxxxxx.x.", ".x........x.", ".x.xxxx...x.", ".x........x.", ".x.xxxxxx.x.", ".x........x.", "..xxxxxxxx..", "............"],
    bolt: ["......xxxx..", ".....xxxx...", "....xxxx....", "...xxxx.....", "..xxxxxxxx..", ".....xxxx...", "....xxxx....", "...xxx......", "..xx........", ".x..........", "............", "............"],
    mail: ["............", "............", "xxxxxxxxxxxx", "xx........xx", "x.x......x.x", "x..x....x..x", "x...xxxx...x", "x..........x", "x..........x", "xxxxxxxxxxxx", "............", "............"],
    phone: ["...xxxxxx...", "...x....x...", "...x....x...", "...x....x...", "...x....x...", "...x....x...", "...x....x...", "...x....x...", "...xxxxxx...", "...xx..xx...", "...xxxxxx...", "............"],
    whatsapp: ["...xxxxxx...", ".xx......xx.", "x..........x", "x...xx.....x", "x...x......x", "x....x.....x", "x.....xx...x", "x..........x", "xx........x.", "x.xx...xxx..", "x...xxx.....", "............"],
    github: [".xx.....xx..", "x..x...x..x.", ".xx.....xx..", ".x.......x..", ".x......x...", ".x.....x....", ".x...xx.....", ".x.xx.......", ".xx.........", ".xx.........", "x..x........", ".xx........."],
    download: [".....xx.....", ".....xx.....", ".....xx.....", ".....xx.....", "..x..xx..x..", "...x.xx.x...", "....xxxx....", ".....xx.....", "............", "x..........x", "xxxxxxxxxxxx", "............"],
    pin: ["...xxxxxx...", "..xxxxxxxx..", ".xxx....xxx.", ".xx......xx.", ".xx......xx.", ".xxx....xxx.", "..xxxxxxxx..", "...xxxxxx...", "....xxxx....", ".....xx.....", ".....xx.....", "............"],
    soundOn: ["............", ".....x......", "....xx...x..", "...xxx....x.", "xxxxxx..x..x", "xxxxxx...x.x", "xxxxxx...x.x", "xxxxxx..x..x", "...xxx....x.", "....xx...x..", ".....x......", "............"],
    soundOff: ["............", ".....x......", "....xx......", "...xxx.x...x", "xxxxxx..x.x.", "xxxxxx...x..", "xxxxxx..x.x.", "xxxxxx.x...x", "...xxx......", "....xx......", ".....x......", "............"],
    close: ["............", ".xx......xx.", ".xxx....xxx.", "..xxx..xxx..", "...xxxxxx...", "....xxxx....", "....xxxx....", "...xxxxxx...", "..xxx..xxx..", ".xxx....xxx.", ".xx......xx.", "............"],
    right: ["............", "............", "....x.......", "....xx......", "....xxx.....", "....xxxx....", "....xxxx....", "....xxx.....", "....xx......", "....x.......", "............", "............"],
    left: ["............", "............", ".......x....", "......xx....", ".....xxx....", "....xxxx....", "....xxxx....", ".....xxx....", "......xx....", ".......x....", "............", "............"],
    trophy: ["..xxxxxxxx..", "xxxxxxxxxxxx", "x.xxxxxxxx.x", "x.xxxxxxxx.x", ".xxxxxxxxxx.", "...xxxxxx...", "....xxxx....", ".....xx.....", ".....xx.....", "...xxxxxx...", "..xxxxxxxx..", "............"],
    globe: ["...xxxxxx...", "..x..xx..x..", ".x..x..x..x.", "xxxxxxxxxxxx", "x...x..x...x", "x...x..x...x", "xxxxxxxxxxxx", "x...x..x...x", ".x..x..x..x.", "..x..xx..x..", "...xxxxxx...", "............"],
    image: ["............", "xxxxxxxxxxxx", "x..........x", "x.xx.......x", "x.xx.......x", "x.......x..x", "x......xxx.x", "x..x..xxxxxx", "x.xxxxxxxxxx", "xxxxxxxxxxxx", "............", "............"],
    external: ["......xxxxxx", "..........xx", ".........x.x", "........x..x", "xxxx...x...x", "x.....x....x", "x....x.....x", "x..........x", "x..........x", "x..........x", "xxxxxxxxxxxx", "............"]
  };

  function icon(name, cls) {
    var rows = ICONS[name];
    if (!rows) return "";
    var rects = "";
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y], x = 0;
      while (x < row.length) {
        if (row.charAt(x) === "x") {
          var s = x;
          while (x < row.length && row.charAt(x) === "x") x++;
          rects += '<rect x="' + s + '" y="' + y + '" width="' + (x - s) + '" height="1"/>';
        } else x++;
      }
    }
    return '<svg class="px-icon' + (cls ? " " + cls : "") + '" viewBox="0 0 12 12" aria-hidden="true" focusable="false">' + rects + "</svg>";
  }

  function fillIcons(root) {
    qsa("[data-icon]", root).forEach(function (el) { el.innerHTML = icon(el.getAttribute("data-icon")); });
  }

  // ---------- Sonido 8 bits (apagado por defecto) ----------
  var audio = null;
  function tone(freq, at, dur, type, vol) {
    if (!state.sound) return;
    try {
      if (!audio) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audio = new AC();
      }
      if (audio.state === "suspended") audio.resume();
      var o = audio.createOscillator(), g = audio.createGain(), now = audio.currentTime + (at || 0);
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(vol || 0.035, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(now); o.stop(now + dur + 0.02);
    } catch (e) { /* sin audio */ }
  }
  var sfx = {
    move: function () { tone(880, 0, 0.05); },
    select: function () { tone(660, 0, 0.06); tone(990, 0.06, 0.09); },
    back: function () { tone(520, 0, 0.06); tone(392, 0.06, 0.09); },
    start: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.07, 0.14, "square", 0.045); }); },
    achieve: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.05 + i * 0.08, 0.13, "triangle", 0.06); }); },
    coin: function () { tone(988, 0, 0.06); tone(1319, 0.06, 0.22); }
  };

  function setSound(on) {
    state.sound = on;
    sset("pf.sound", on ? "1" : "0");
    updateSoundUI();
    if (on) sfx.coin();
  }

  function updateSoundUI() {
    qsa(".sound-state").forEach(function (el) { el.innerHTML = px(state.sound ? t("title.on") : t("title.off")); });
    qsa("[data-sound-toggle]").forEach(function (b) { b.setAttribute("aria-pressed", String(state.sound)); });
    var hud = qs("#hud-sound .snd-icon");
    if (hud) hud.innerHTML = icon(state.sound ? "soundOn" : "soundOff");
  }

  // ---------- Textos fijos ----------
  function applyStatic() {
    document.documentElement.lang = state.lang;
    document.title = t("meta.title");
    qsa("[data-i18n]").forEach(function (el) {
      var txt = t(el.getAttribute("data-i18n"));
      if (el.hasAttribute("data-px")) el.innerHTML = px(txt); else el.textContent = txt;
    });
    qsa("[data-px-static]").forEach(function (el) {
      if (!el._orig) el._orig = el.textContent;
      el.innerHTML = px(el._orig);
    });
    qsa("[data-i18n-aria]").forEach(function (el) {
      var label = t(el.getAttribute("data-i18n-aria"));
      el.setAttribute("aria-label", label);
      el.setAttribute("title", label);
    });
    qsa("[data-set-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === state.lang)); });
    var code = qs(".lang-code");
    if (code) code.textContent = state.lang === "es" ? "EN" : "ES";
    var cv = qs("#hud-cv");
    if (cv) {
      cv.href = D.contact.cv[state.lang];
      cv.setAttribute("aria-label", t("perfil.cta.cv"));
      cv.setAttribute("title", t("perfil.cta.cv"));
    }
    updateSoundUI();
  }

  // ---------- Piezas de interfaz ----------
  function secHead(titleKey, subKey) {
    return '<header class="sec-head"><h2>' + px(t(titleKey)) + "</h2><p>" + esc(t(subKey)) + "</p></header>";
  }

  function win(title, iconName, inner, cls) {
    return '<div class="win' + (cls ? " " + cls : "") + '"><div class="win-title">' + icon(iconName) + "<span>" + px(title) + "</span></div>" + inner + "</div>";
  }

  function segs(level) {
    var h = '<span class="segs" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= level ? "on" : "") + '" style="animation-delay:' + (120 + i * 90) + 'ms"></i>';
    return h + "</span>";
  }

  function levelLabel(level) {
    return t("skills.lv") + " " + level + " · " + D.levelNames[state.lang][level];
  }

  // ---------- Perfil ----------
  function renderPerfil() {
    var langs = D.languages.map(function (l) {
      var v = L(l);
      return '<div class="lang-row"><b>' + esc(v[0]) + "</b><small>" + esc(v[1]) + "</small>" + segs(l.level) + "</div>";
    }).join("");

    var card = '<div class="win char-card"><div class="win-title">' + icon("user") + "<span>" + px(t("perfil.player")) + "</span></div>" +
      '<button class="portrait" type="button" aria-label="' + esc(t("perfil.photoAlt")) + '"><canvas width="240" height="240"></canvas><span class="portrait-tag">8-BIT</span></button>' +
      '<h3 class="char-name">JAVIER MIRANDA TAPIA</h3>' +
      '<p class="char-class">' + esc(t("perfil.class")) + "</p>" +
      '<div class="char-meta"><span>' + icon("pin") + esc(t("perfil.origin")) + '</span><span><i class="dot-live" aria-hidden="true"></i>' + esc(t("perfil.status")) + "</span></div>" +
      '<h4 class="sub-title">' + px(t("perfil.langs")) + "</h4>" + langs +
      '<h4 class="sub-title">' + px(t("perfil.inventory")) + "</h4>" + inventoryHTML() + "</div>";

    var stats = '<div class="stats">' + D.stats.map(function (s) {
      return '<div class="stat"><b>' + esc(s.value) + "</b><span>" + esc(L(s)) + "</span></div>";
    }).join("") + "</div>";

    var passives = '<ul class="slots">' + D.passives.map(function (p, i) {
      var tone = ["pink", "", "cyan", "green", ""][i] || "";
      return '<li class="slot"><span class="slot-ico ' + tone + '">' + icon(p.icon) + "</span><span>" + esc(L(p)) + "</span></li>";
    }).join("") + "</ul>";

    var bio = '<p class="bio">' + esc(t("perfil.bio")) + "</p>" +
      '<div class="btn-row"><button class="btn" type="button" data-goto="proyectos">' + icon("right") + px(t("perfil.cta.projects")) + "</button>" +
      '<a class="btn btn-ghost" href="' + esc(D.contact.cv[state.lang]) + '" download>' + icon("download") + px(t("perfil.cta.cv")) + "</a></div>";

    qs("#s-perfil").innerHTML = secHead("perfil.title", "perfil.sub") +
      '<div class="profile">' + card + '<div class="stack">' +
      win(t("perfil.story"), "scroll", bio) +
      win(t("perfil.stats"), "bolt", stats) +
      win(t("perfil.passives"), "star", passives) +
      "</div></div>";
    setupPortrait();
  }

  function inventoryHTML() {
    return '<ul class="slots one">' + D.inventory.map(function (p) {
      return '<li class="slot"><span class="slot-ico cyan">' + icon(p.icon) + "</span><span>" + esc(L(p)) + "</span></li>";
    }).join("") + "</ul>";
  }

  // ---------- Habilidades ----------
  function renderSkills() {
    var groups = D.skillGroups.map(function (g) {
      var items = g.skills.map(function (s) {
        var h = '<li class="skill"><span class="skill-name">' + esc(L(s.name)) + "</span>";
        if (s.level) {
          h += '<span class="skill-lvl">' + esc(levelLabel(s.level)) + "</span>" + segs(s.level);
        } else if (s.projects) {
          h += '<span class="skill-lvl">' + icon("star") + '</span><span class="skill-unlock">' + esc(t("skills.unlocked")) + ":" +
            s.projects.map(function (id) {
              var p = project(id);
              return p ? '<button type="button" class="proj-chip" style="--c:' + p.color + '" data-open="' + p.id + '">' + esc(p.name) + "</button>" : "";
            }).join("") + "</span>";
        } else if (s.usedIn) {
          h += '<span class="skill-lvl">' + icon("check") + '</span><span class="skill-unlock">' + esc(t("skills.usedIn")) + ': <span class="chip">' + esc(L(s.usedIn)) + "</span></span>";
        }
        return h + "</li>";
      }).join("");
      var tall = g.skills.some(function (s) { return s.projects; });
      return win(L(g), g.icon, '<ul class="skill-list">' + items + "</ul>", tall ? "tall" : "");
    }).join("");

    var badges = '<ul class="badges">' + D.badges.map(function (b) {
      return '<li class="badge' + (b.progress ? " progress" : "") + '"><span class="medal">' + icon(b.icon) + '</span><span class="badge-text"><span class="badge-state">' +
        px(b.progress ? t("skills.inProgress") : t("skills.done")) + "</span>" + esc(L(b)) +
        (b.progress ? '<span class="progressbar" aria-hidden="true"><i></i></span>' : "") + "</span></li>";
    }).join("") + "</ul>";

    qs("#s-habilidades").innerHTML = secHead("skills.title", "skills.sub") +
      '<div class="stack"><div class="skills-layout">' + groups + "</div>" + win(t("skills.badges"), "trophy", badges) + "</div>";
  }

  // ---------- Experiencia ----------
  function renderXP() {
    var quests = '<ol class="quests">' + D.jobs.map(function (j) {
      var tasks = L(j.tasks).map(function (x) { return "<li>" + icon("check") + "<span>" + esc(x) + "</span></li>"; }).join("");
      var rewards = L(j.rewards).map(function (x) { return '<span class="chip">' + esc(x) + "</span>"; }).join("");
      return '<li class="quest' + (j.active ? " active" : "") + '"><div class="quest-top"><span class="quest-tag">' +
        px(j.active ? t("xp.active") : t("xp.complete")) + '</span><span class="quest-dates">' + esc(L(j.dates)) + "</span></div>" +
        "<h3>" + esc(j.org) + '</h3><p class="quest-role">' + esc(L(j.role)) + "</p>" +
        '<ul class="objectives" aria-label="' + esc(t("xp.objectives")) + '">' + tasks + "</ul>" +
        '<div class="rewards"><span class="rewards-label">' + px(t("xp.rewards")) + ":</span>" + rewards + "</div></li>";
    }).join("") + "</ol>";

    var eduIcons = { done: "book", progress: "shield", past: "flag" };
    var edu = '<ul class="edu">' + D.education.map(function (e) {
      return '<li class="edu-item' + (e.state === "progress" ? " progress" : "") + '"><span class="slot-ico ' + (e.state === "progress" ? "cyan" : "") + '">' + icon(eduIcons[e.state] || "book") +
        "</span><div><h3>" + esc(L(e.title)) + "</h3><p>" + esc(e.org) + '</p><span class="quest-dates">' + esc(L(e.dates)) + "</span></div></li>";
    }).join("") + "</ul>";

    qs("#s-experiencia").innerHTML = secHead("xp.title", "xp.sub") +
      '<div class="stack">' + win(t("xp.jobs"), "briefcase", quests) + win(t("xp.edu"), "book", edu) + "</div>";
  }

  // ---------- Proyectos ----------
  function coverHTML(p) {
    if (p.device === "landscape") {
      return '<img src="' + esc(p.cover[0]) + '" alt="' + esc(p.name) + '" loading="lazy">';
    }
    return '<div class="fan">' + p.cover.map(function (src) {
      return '<div class="mini-phone"><img src="' + esc(src) + '" alt="" loading="lazy"></div>';
    }).join("") + "</div>";
  }

  function renderProjects() {
    var n = 0;
    var cards = D.projects.map(function (p) {
      if (!p.bonus) n++;
      var num = p.bonus ? t("proj.bonus") : t("proj.level") + " " + n;
      var actions = p.demo
        ? '<button class="btn" type="button" data-open="' + p.id + '" data-mode="demo">' + icon("right") + px(t("proj.play")) + "</button>" +
          '<button class="btn btn-ghost" type="button" data-open="' + p.id + '" data-mode="gallery">' + icon("image") + px(t("proj.gallery")) + "</button>"
        : '<button class="btn" type="button" data-open="' + p.id + '" data-mode="gallery">' + icon("image") + px(t("proj.gallery")) + "</button>";
      return '<article class="win level' + (p.bonus ? " bonus" : "") + '" style="--c:' + p.color + ";--cg:" + rgba(p.color, 0.42) + '">' +
        '<div class="level-cover" data-open="' + p.id + '" role="presentation">' +
        '<span class="status ' + p.statusKind + '">' + px(L(p.status)) + "</span>" +
        '<span class="level-num">' + px(num) + "</span>" +
        (p.bonus ? '<span class="hobby-ribbon">HOBBY</span>' : "") + coverHTML(p) + "</div>" +
        '<div class="level-body"><p class="level-tag">' + esc(L(p.tag)) + "</p><h3>" + px(p.name) + "</h3>" +
        (p.extraBadge ? '<span class="extra-badge">' + esc(L(p.extraBadge)) + "</span>" : "") +
        '<p class="level-pitch">' + esc(L(p.pitch)) + "</p>" +
        (p.hobby ? '<p class="hobby-note"><b>' + icon("pad") + " " + esc(t("proj.hobbyLabel")) + "</b> " + esc(L(p.hobby)) + "</p>" : "") +
        '<ul class="chips">' + p.stack.slice(0, 5).map(function (s) { return '<li class="chip">' + esc(s) + "</li>"; }).join("") + "</ul>" +
        '<div class="btn-row">' + actions + "</div></div></article>";
    }).join("");
    qs("#s-proyectos").innerHTML = secHead("proj.title", "proj.sub") + '<div class="levels">' + cards + "</div>";
  }

  // ---------- Contacto ----------
  function renderContact() {
    var c = D.contact;
    var items = [
      { ico: "mail", label: t("contact.email"), val: '<a class="val" href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>", copy: c.email },
      { ico: "phone", label: t("contact.phone"), val: '<a class="val" href="tel:' + esc(c.phone) + '">' + esc(c.phoneLabel) + "</a>", copy: c.phoneLabel },
      { ico: "whatsapp", label: t("contact.whatsapp"), val: '<a class="val" href="' + esc(c.whatsapp) + '" target="_blank" rel="noopener">' + esc(t("contact.waText")) + "</a>" }
    ];
    if (c.github) items.push({ ico: "github", label: t("contact.github"), val: '<a class="val" href="' + esc(c.github) + '" target="_blank" rel="noopener">' + esc(c.github.replace(/^https?:\/\//, "")) + "</a>" });
    items.push({ ico: "pin", label: t("contact.locationLabel"), val: '<span class="val-text">' + esc(t("contact.location")) + "</span>" });

    var list = '<p class="contact-lead">' + esc(t("contact.lead")) + '</p><ul class="contact-list">' + items.map(function (it) {
      return '<li class="contact-item"><span class="slot-ico">' + icon(it.ico) + "</span><div><small>" + px(it.label) + "</small>" + it.val + "</div>" +
        (it.copy ? '<button type="button" class="mini-btn" data-copy="' + esc(it.copy) + '">' + px(t("contact.copy")) + "</button>" : "") + "</li>";
    }).join("") + "</ul>";

    var thanks = '<div class="thanks"><div class="trophy-big">' + icon("trophy") + '</div><p class="big">' + px(t("contact.thanks")) + "</p><p>" + esc(t("contact.thanksText")) + "</p>" +
      '<div class="cv-buttons"><a class="btn" href="' + esc(c.cv.es) + '" download>' + icon("download") + px(t("contact.cv") + " · " + t("contact.cvEs")) + "</a>" +
      '<a class="btn btn-ghost" href="' + esc(c.cv.en) + '" download>' + icon("download") + px(t("contact.cv") + " · " + t("contact.cvEn")) + "</a></div></div>";

    qs("#s-contacto").innerHTML = secHead("contact.title", "contact.sub") +
      '<div class="contact-grid">' + win(t("contact.room"), "chat", list) + win(t("contact.saveTitle"), "trophy", thanks) + "</div>";
  }

  function renderAll() {
    renderPerfil();
    renderSkills();
    renderXP();
    renderProjects();
    renderContact();
  }

  // ---------- Retrato pixelado ----------
  var photo = new Image();
  var photoReady = false;
  var portraitTimer = null;
  photo.onload = function () { photoReady = true; drawHudAvatar(); setupPortrait(); };
  photo.src = "img/foto.jpg";

  function pixelate(canvas, block) {
    if (!photoReady || !canvas) return;
    var g = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    var side = Math.min(photo.naturalWidth, photo.naturalHeight);
    var sx = (photo.naturalWidth - side) / 2, sy = (photo.naturalHeight - side) / 2;
    var sw = Math.max(1, Math.round(w / block)), sh = Math.max(1, Math.round(h / block));
    var off = document.createElement("canvas");
    off.width = sw; off.height = sh;
    var og = off.getContext("2d");
    og.imageSmoothingEnabled = true;
    og.drawImage(photo, sx, sy, side, side, 0, 0, sw, sh);
    g.imageSmoothingEnabled = block <= 1;
    g.clearRect(0, 0, w, h);
    g.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);
  }

  function drawHudAvatar() { pixelate(qs(".hud-avatar"), 3); }

  function setupPortrait(animate) {
    var btn = qs("#s-perfil .portrait");
    if (!btn || !photoReady) return;
    var canvas = btn.querySelector("canvas");
    clearInterval(portraitTimer);
    if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var steps = [40, 30, 24, 16, 12, 8, 6, 4, 3, 2, 1], i = 0;
      portraitTimer = setInterval(function () {
        pixelate(canvas, steps[i++]);
        if (i >= steps.length) clearInterval(portraitTimer);
      }, 75);
    } else {
      pixelate(canvas, btn.classList.contains("is-8bit") ? 8 : 1);
    }
    if (!btn._wired) {
      btn._wired = true;
      var set8 = function (on) {
        btn.classList.toggle("is-8bit", on);
        clearInterval(portraitTimer);
        pixelate(canvas, on ? 8 : 1);
      };
      btn.addEventListener("mouseenter", function () { set8(true); sfx.move(); });
      btn.addEventListener("mouseleave", function () { set8(false); });
      btn.addEventListener("click", function () { set8(!btn.classList.contains("is-8bit")); sfx.move(); });
    }
  }

  // ---------- Logros ----------
  function toast(iconName, title, name, desc) {
    var box = qs("#toasts");
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="slot-ico">' + icon(iconName) + "</span><div><small>" + px(title) + "</small><b>" + esc(name) + "</b>" + (desc ? "<span>" + esc(desc) + "</span>" : "") + "</div>";
    box.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    }, 3400);
  }

  function unlock(id) {
    if (state.unlocked.indexOf(id) >= 0) return;
    var a = D.achievements[id];
    if (!a) return;
    state.unlocked.push(id);
    sset("pf.unlocked", JSON.stringify(state.unlocked), true);
    var txt = L(a);
    toast(a.icon, t("toast.unlocked"), txt[0], txt[1]);
    sfx.achieve();
  }

  function updateXP() {
    var n = state.visited.length;
    qs("#xp-count").textContent = n + "/" + TABS.length;
    qs("#xp-fill").style.width = (n / TABS.length * 100) + "%";
  }

  function visit(tab) {
    if (state.visited.indexOf(tab) >= 0) return;
    state.visited.push(tab);
    sset("pf.visited", JSON.stringify(state.visited), true);
    updateXP();
    unlock(tab);
    if (state.visited.length === TABS.length && state.unlocked.indexOf("complete") < 0) {
      state.unlocked.push("complete");
      sset("pf.unlocked", JSON.stringify(state.unlocked), true);
      setTimeout(function () { toast("trophy", t("toast.complete"), t("toast.completeText"), ""); sfx.start(); }, 1500);
    }
  }

  // ---------- Pestañas ----------
  function go(tab, opts) {
    opts = opts || {};
    if (TABS.indexOf(tab) < 0) tab = "perfil";
    var changed = state.tab !== tab;
    state.tab = tab;
    TABS.forEach(function (id) {
      var panel = qs("#s-" + id), btn = qs("#tab-" + id);
      panel.hidden = id !== tab;
      btn.setAttribute("aria-selected", String(id === tab));
      btn.tabIndex = id === tab ? 0 : -1;
    });
    if (changed) {
      var panel = qs("#s-" + tab);
      panel.classList.remove("panel");
      void panel.offsetWidth;
      panel.classList.add("panel");
      if (opts.scroll !== false) window.scrollTo(0, 0);
      if (!opts.silent) sfx.select();
      if (tab === "perfil") setupPortrait(true);
    }
    if (!opts.noHash) {
      try { history.replaceState(history.state && history.state.modal ? null : history.state, "", "#" + tab); } catch (e) { /* file:// */ }
    }
    visit(tab);
  }

  // ---------- Visor de proyectos ----------
  function openProject(id, mode, fromHistory) {
    var p = project(id);
    if (!p) return;
    if (state.tab !== "proyectos") go("proyectos", { noHash: true, silent: true });
    if (!state.modal) state.opener = document.activeElement;
    state.modal = { id: id, mode: mode || (p.demo ? "demo" : "gallery"), shot: 0, started: false };
    renderModal();
    var m = qs("#modal");
    m.hidden = false;
    document.body.classList.add("locked");
    var close = qs(".modal-close", m);
    if (close) close.focus();
    if (!fromHistory) {
      try { history.pushState({ modal: id }, "", "#proyectos/" + id); } catch (e) { /* file:// */ }
    }
    sfx.select();
  }

  function closeModal(fromHistory) {
    if (!state.modal) return;
    state.modal = null;
    var m = qs("#modal");
    m.hidden = true;
    m.innerHTML = "";
    document.body.classList.remove("locked");
    if (state.opener && state.opener.focus) {
      try { state.opener.focus({ preventScroll: true }); } catch (e) { state.opener.focus(); }
    }
    state.opener = null;
    sfx.back();
    if (!fromHistory) {
      try {
        if (history.state && history.state.modal) history.back();
        else history.replaceState(null, "", "#proyectos");
      } catch (e) { /* file:// */ }
    }
  }

  function viewerHTML(p) {
    var st = state.modal;
    var frame = p.device === "landscape" ? "monitor" : "phone";
    var tabs = "";
    if (p.demo && p.shots && p.shots.length) {
      tabs = '<div class="seg viewer-tabs" role="group">' +
        '<button type="button" class="seg-btn" data-mode-switch="demo" aria-pressed="' + (st.mode === "demo") + '">' + px(t("proj.demoTab")) + "</button>" +
        '<button type="button" class="seg-btn" data-mode-switch="gallery" aria-pressed="' + (st.mode === "gallery") + '">' + px(t("proj.shotsTab")) + "</button></div>";
    }
    if (st.mode === "demo" && p.demo) {
      var poster = p.shots && p.shots.length ? p.shots[p.id === "comite" ? 3 : 0].src : p.cover[0];
      return tabs + '<div class="' + frame + '"><div class="screen" id="demo-screen">' +
        '<img src="' + esc(poster) + '" alt="">' +
        '<div class="demo-overlay"><button type="button" class="btn" data-start-demo>' + icon("right") + px(t("proj.start")) + "</button><p>" + esc(t("proj.demoHint")) + "</p></div>" +
        "</div></div>" +
        '<a class="viewer-link" href="' + esc(p.demo) + '" target="_blank" rel="noopener">' + icon("external") + esc(t("proj.fullscreen")) + "</a>";
    }
    var shot = p.shots[st.shot] || p.shots[0];
    var dots = p.shots.map(function (s, i) {
      return '<button type="button" class="thumb" data-shot-index="' + i + '" aria-label="' + esc(L(s)) + '" aria-current="' + (i === st.shot) + '"></button>';
    }).join("");
    return tabs + '<div class="' + frame + '"><div class="screen" id="gallery-screen"><img id="gallery-img" src="' + esc(shot.src) + '" alt="' + esc(L(shot)) + '"></div></div>' +
      '<div class="viewer-nav"><button type="button" class="btn-icon" data-shot-step="-1" aria-label="' + esc(t("proj.prev")) + '">' + icon("left") + "</button>" +
      '<p class="viewer-cap" id="gallery-cap">' + esc(L(shot)) + "</p>" +
      '<button type="button" class="btn-icon" data-shot-step="1" aria-label="' + esc(t("proj.next")) + '">' + icon("right") + "</button></div>" +
      '<div class="thumbs">' + dots + "</div>";
  }

  function renderModal() {
    var st = state.modal;
    if (!st) return;
    var p = project(st.id);
    var feats = L(p.features).map(function (f) { return "<li>" + icon("right") + "<span>" + esc(f) + "</span></li>"; }).join("");
    var stats = p.stats.map(function (s) { return '<div class="stat"><b>' + esc(s.value) + "</b><span>" + esc(L(s)) + "</span></div>"; }).join("");
    var html = '<div class="win modal-win" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="--c:' + p.color + '">' +
      '<button type="button" class="btn-icon modal-close" data-close aria-label="' + esc(t("proj.close")) + '">' + icon("close") + "</button>" +
      '<div class="modal-grid' + (p.device === "landscape" ? " landscape" : "") + '">' +
      '<div class="viewer" id="viewer">' + viewerHTML(p) + "</div>" +
      '<div class="modal-info"><span class="status modal-status ' + p.statusKind + '">' + px(L(p.status)) + "</span>" +
      '<h2 id="modal-title">' + px(p.name) + '</h2><p class="level-tag">' + esc(L(p.tag)) + "</p>" +
      (p.extraBadge ? '<span class="extra-badge">' + esc(L(p.extraBadge)) + "</span>" : "") +
      '<p class="modal-pitch">' + esc(L(p.pitch)) + "</p>" +
      (p.hobby ? '<p class="hobby-note"><b>' + icon("pad") + " " + esc(t("proj.hobbyLabel")) + "</b> " + esc(L(p.hobby)) + "</p>" : "") +
      '<div class="info-block"><h3>' + px(t("proj.features")) + '</h3><ul class="features">' + feats + "</ul></div>" +
      '<div class="info-block"><h3>' + px(t("proj.stack")) + '</h3><ul class="chips">' + p.stack.map(function (s) { return '<li class="chip">' + esc(s) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="info-block"><h3>' + px(t("proj.stats")) + '</h3><div class="mini-stats">' + stats + "</div></div>" +
      '<p class="note">' + esc(L(p.note)) + "</p>" +
      "</div></div></div>";
    qs("#modal").innerHTML = html;
    wireSwipe();
  }

  function refreshViewer() {
    var p = project(state.modal.id);
    var v = qs("#viewer");
    if (v) v.innerHTML = viewerHTML(p);
    wireSwipe();
  }

  function stepShot(delta) {
    var st = state.modal;
    if (!st || st.mode !== "gallery") return;
    var p = project(st.id);
    st.shot = (st.shot + delta + p.shots.length) % p.shots.length;
    showShot();
  }

  function showShot() {
    var st = state.modal, p = project(st.id), s = p.shots[st.shot];
    var img = qs("#gallery-img"), cap = qs("#gallery-cap");
    if (img) { img.src = s.src; img.alt = L(s); }
    if (cap) cap.textContent = L(s);
    qsa(".thumb", qs("#modal")).forEach(function (b, i) { b.setAttribute("aria-current", String(i === st.shot)); });
    sfx.move();
  }

  function wireSwipe() {
    var screen = qs("#gallery-screen");
    if (!screen) return;
    var x0 = null;
    screen.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
    screen.addEventListener("pointerup", function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 40) stepShot(dx < 0 ? 1 : -1);
    });
  }

  function startDemo() {
    var st = state.modal;
    if (!st) return;
    var p = project(st.id);
    var screen = qs("#demo-screen");
    if (!screen || !p.demo) return;
    var overlay = qs(".demo-overlay", screen);
    overlay.innerHTML = '<p class="loading">' + px(t("proj.loading")) + "</p>";
    var frame = document.createElement("iframe");
    frame.title = p.name;
    frame.setAttribute("allow", "fullscreen; clipboard-write");
    frame.src = p.demo;
    frame.addEventListener("load", function () {
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        var img = qs("img", screen);
        if (img) img.parentNode.removeChild(img);
      }, 1600);
    });
    screen.appendChild(frame);
    st.started = true;
    unlock("demo");
    sfx.start();
  }

  // ---------- Copiar al portapapeles ----------
  function copyText(text, btn) {
    var done = function () {
      btn.innerHTML = px(t("contact.copied"));
      sfx.coin();
      setTimeout(function () { btn.innerHTML = px(t("contact.copy")); }, 1600);
    };
    var fallback = function () {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* sin portapapeles */ }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  // ---------- Pantalla de título ----------
  var inApp = false;
  function enterApp(instant, tab) {
    if (inApp) return;
    inApp = true;
    sset("pf.started", "1", true);
    var title = qs("#title");
    var show = function () {
      title.hidden = true;
      qs("#app").hidden = false;
      document.body.classList.add("in-app");
      go(tab || "perfil", { silent: true, scroll: false });
    };
    if (instant) { show(); return; }
    sfx.start();
    title.classList.add("leaving");
    setTimeout(show, 450);
  }

  // ---------- Código secreto ----------
  var KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  var kpos = 0;
  function coinRain() {
    for (var i = 0; i < 36; i++) {
      var c = document.createElement("span");
      c.className = "coin";
      c.style.left = Math.random() * 100 + "vw";
      c.style.animationDuration = (1.6 + Math.random() * 1.8) + "s";
      c.style.animationDelay = (Math.random() * 0.8) + "s";
      document.body.appendChild(c);
      setTimeout((function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; })(c), 4200);
    }
    toast("star", t("toast.konami"), "↑↑↓↓←→←→BA", t("toast.konamiText"));
    sfx.coin();
  }

  // ---------- Rutas (#pestaña y #proyectos/id) ----------
  function parseHash() {
    var h = (location.hash || "").replace(/^#/, "");
    var parts = h.split("/");
    return { tab: TABS.indexOf(parts[0]) >= 0 ? parts[0] : null, project: parts[0] === "proyectos" && parts[1] && project(parts[1]) ? parts[1] : null };
  }

  window.addEventListener("popstate", function () {
    if (!inApp) return;
    var r = parseHash();
    if (r.project) {
      if (!state.modal || state.modal.id !== r.project) openProject(r.project, null, true);
    } else {
      if (state.modal) closeModal(true);
      if (r.tab && r.tab !== state.tab) go(r.tab, { noHash: true });
    }
  });

  // ---------- Eventos ----------
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-set-lang],[data-sound-toggle],[data-goto],[data-tab],[data-open],[data-close],[data-mode-switch],[data-start-demo],[data-shot-step],[data-shot-index],[data-copy],#hud-lang,#start,#modal") : null;
    if (!el) {
      return;
    }
    if (el.id === "modal") {
      if (e.target === el) closeModal();
      return;
    }
    if (el.hasAttribute("data-set-lang")) { setLang(el.getAttribute("data-set-lang")); sfx.move(); return; }
    if (el.hasAttribute("data-sound-toggle")) { setSound(!state.sound); return; }
    if (el.id === "hud-lang") { setLang(state.lang === "es" ? "en" : "es"); sfx.move(); return; }
    if (el.id === "start") { enterApp(false, parseHash().tab); return; }
    if (el.hasAttribute("data-tab")) { go(el.getAttribute("data-tab")); return; }
    if (el.hasAttribute("data-goto")) { go(el.getAttribute("data-goto")); return; }
    if (el.hasAttribute("data-close")) { closeModal(); return; }
    if (el.hasAttribute("data-open")) { openProject(el.getAttribute("data-open"), el.getAttribute("data-mode")); return; }
    if (el.hasAttribute("data-mode-switch")) {
      state.modal.mode = el.getAttribute("data-mode-switch");
      state.modal.started = false;
      refreshViewer();
      sfx.move();
      return;
    }
    if (el.hasAttribute("data-start-demo")) { startDemo(); return; }
    if (el.hasAttribute("data-shot-step")) { stepShot(parseInt(el.getAttribute("data-shot-step"), 10)); return; }
    if (el.hasAttribute("data-shot-index")) { state.modal.shot = parseInt(el.getAttribute("data-shot-index"), 10); showShot(); return; }
    if (el.hasAttribute("data-copy")) { copyText(el.getAttribute("data-copy"), el); return; }
  });

  // En la pantalla de título, un clic en cualquier parte que no sea un botón empieza el juego.
  qs("#title").addEventListener("click", function (e) {
    if (e.target.closest("button")) return;
    enterApp(false, parseHash().tab);
  });

  document.addEventListener("keydown", function (e) {
    var key = (e.key || "").toLowerCase();

    // código secreto
    if (key === KONAMI[kpos]) {
      kpos++;
      if (kpos === KONAMI.length) { kpos = 0; coinRain(); }
    } else {
      kpos = key === KONAMI[0] ? 1 : 0;
    }

    if (!inApp) {
      if ((key === "enter" || key === " ") && !(e.target.closest && e.target.closest(".title-options"))) {
        e.preventDefault();
        enterApp(false, parseHash().tab);
      }
      return;
    }

    if (state.modal) {
      if (key === "escape") { e.preventDefault(); closeModal(); return; }
      if (key === "arrowright") { stepShot(1); return; }
      if (key === "arrowleft") { stepShot(-1); return; }
      if (key === "tab") trapFocus(e);
      return;
    }

    var typing = e.target && /input|textarea|select/i.test(e.target.tagName);
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.target.closest && e.target.closest(".menu") && (key === "arrowright" || key === "arrowleft")) {
      var i = TABS.indexOf(state.tab);
      var next = TABS[(i + (key === "arrowright" ? 1 : -1) + TABS.length) % TABS.length];
      go(next);
      qs("#tab-" + next).focus();
      e.preventDefault();
      return;
    }
    if (key >= "1" && key <= "5") go(TABS[parseInt(key, 10) - 1]);
  });

  function trapFocus(e) {
    var m = qs("#modal .modal-win");
    if (!m) return;
    var f = qsa('a[href],button:not([disabled]),iframe,[tabindex]:not([tabindex="-1"])', m).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function setLang(lang) {
    if (lang !== "es" && lang !== "en") return;
    state.lang = lang;
    sset("pf.lang", lang);
    applyStatic();
    renderAll();
    if (state.tab) {
      TABS.forEach(function (id) { qs("#s-" + id).hidden = id !== state.tab; });
    }
    if (state.modal) {
      var mode = state.modal.mode, shot = state.modal.shot;
      renderModal();
      state.modal.mode = mode; state.modal.shot = shot;
    }
  }

  // ---------- Arranque ----------
  fillIcons(document);
  applyStatic();
  renderAll();
  updateXP();

  var route = parseHash();
  if (route.tab || sget("pf.started", true) === "1") {
    enterApp(true, route.tab || "perfil");
    if (route.project) openProject(route.project, null, true);
  } else {
    qs("#start").focus({ preventScroll: true });
  }
})();
