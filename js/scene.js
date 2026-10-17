/* Fondo animado: Valparaíso de noche en pixel art.
   Se dibuja a 320 px de ancho y el navegador lo agranda sin suavizar. */
(function () {
  "use strict";

  var canvas = document.getElementById("scene");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 320, H = 180;
  var base = null;
  var stars = [], lights = [], reflections = [], boats = [], cranes = [];
  var shoreY = 0, moon = null, track = null, meteor = null;
  var frame = 0, last = 0, running = false;

  var BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  var SKY = ["#05081a", "#080d26", "#0e1338", "#171a4a", "#221f58", "#332562", "#4a2c6b", "#653671"];
  var SEA = ["#0c1640", "#0a1234", "#080e2a", "#060a20"];
  var HOUSES = ["#d94f45", "#e8b13a", "#3f8fc9", "#4fb586", "#e07a3f", "#8f5bd6", "#e05a9a", "#d9d2c0", "#5fb8c9", "#c9a227", "#f2665a", "#7ac74f"];

  function mulberry(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function rgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  function dim(hex, f) {
    var c = rgb(hex);
    return "rgb(" + Math.round(c[0] * f) + "," + Math.round(c[1] * f) + "," + Math.round(c[2] * f) + ")";
  }

  // Degradado vertical con tramado ordenado (el clásico "dithering" de 16 bits)
  function dither(g, y0, y1, palette) {
    var h = Math.max(1, y1 - y0);
    var img = g.createImageData(W, h);
    var cols = palette.map(rgb);
    for (var y = 0; y < h; y++) {
      var t = (y / h) * (cols.length - 1);
      var i = Math.floor(t), f = t - i;
      for (var x = 0; x < W; x++) {
        var th = (BAYER[(y + y0) & 3][x & 3] + 0.5) / 16;
        var c = cols[Math.min(cols.length - 1, f > th ? i + 1 : i)];
        var p = (y * W + x) * 4;
        img.data[p] = c[0]; img.data[p + 1] = c[1]; img.data[p + 2] = c[2]; img.data[p + 3] = 255;
      }
    }
    g.putImageData(img, 0, y0);
  }

  function ridgeFn(R, baseY, amp) {
    var p1 = R() * 6.28, p2 = R() * 6.28, p3 = R() * 6.28;
    var k1 = 1.2 + R() * 1.4, k2 = 3 + R() * 3, k3 = 9 + R() * 7;
    return function (x) {
      var u = (x / W) * Math.PI * 2;
      return Math.round(baseY - amp * (0.62 * Math.sin(u * k1 + p1) + 0.28 * Math.sin(u * k2 + p2) + 0.1 * Math.sin(u * k3 + p3)));
    };
  }

  function hill(g, R, ridge, color, o) {
    g.fillStyle = color;
    for (var x = 0; x < W; x++) {
      var top = ridge(x);
      g.fillRect(x, top, 1, shoreY - top);
    }
    var hx = -1;
    while (hx < W) {
      var w = o.w[0] + Math.floor(R() * (o.w[1] - o.w[0] + 1));
      var top2 = Math.max(ridge(hx), ridge(hx + w - 1), ridge(hx + (w >> 1))) + 1 + Math.floor(R() * 2);
      var y = top2;
      while (y < shoreY - 1) {
        var h = o.h[0] + Math.floor(R() * (o.h[1] - o.h[0] + 1));
        if (y + h > shoreY - 1) break;
        if (R() < o.density) {
          var c = HOUSES[Math.floor(R() * HOUSES.length)];
          g.fillStyle = dim(c, o.dim);
          g.fillRect(hx, y, w, h);
          if (o.roof) {
            g.fillStyle = dim(c, o.dim * 0.55);
            g.fillRect(hx, y, w, 1);
          }
          if (w <= 2) {
            if (R() < o.lit) addLight(g, hx + (R() < 0.5 ? 0 : 1), y + h - 1, R);
          } else {
            for (var wy = y + (o.roof ? 2 : 1); wy < y + h - 1; wy += 2) {
              for (var wx = hx + 1; wx < hx + w - 1; wx += 2) {
                if (R() < o.lit) addLight(g, wx, wy, R);
                else if (o.dark) { g.fillStyle = "#11132e"; g.fillRect(wx, wy, 1, 1); }
              }
            }
          }
        }
        y += h + (R() < 0.45 ? 0 : 1);
      }
      hx += w + (R() < 0.3 ? 1 : 0);
    }
  }

  function addLight(g, x, y, R) {
    var c = R() < 0.72 ? "#ffd76a" : "#ffab5a";
    g.fillStyle = c;
    g.fillRect(x, y, 1, 1);
    lights.push({ x: x, y: y, c: c, off: false });
  }

  function build() {
    var R = mulberry(20261016);
    stars = []; lights = []; reflections = []; boats = []; cranes = [];
    base = document.createElement("canvas");
    base.width = W; base.height = H;
    var g = base.getContext("2d");

    shoreY = Math.round(H * 0.8);
    var skyEnd = Math.round(H * 0.56);

    // Cielo
    dither(g, 0, skyEnd, SKY);
    g.fillStyle = SKY[SKY.length - 1];
    g.fillRect(0, skyEnd, W, shoreY - skyEnd);

    // Luna con halo tramado
    moon = { x: Math.round(W * 0.8), y: Math.round(H * 0.15), r: 8 };
    for (var yy = -16; yy <= 16; yy++) {
      for (var xx = -16; xx <= 16; xx++) {
        var d = Math.sqrt(xx * xx + yy * yy);
        var px = moon.x + xx, py = moon.y + yy;
        if (d <= moon.r) {
          g.fillStyle = (xx > 2 && yy < -1 && d > moon.r - 3) ? "#fff8dc" : "#efe5bd";
          g.fillRect(px, py, 1, 1);
        } else if (d <= moon.r + 7) {
          var glow = 1 - (d - moon.r) / 7;
          if (glow * 0.85 > (BAYER[py & 3][px & 3] + 0.5) / 16) {
            g.fillStyle = "#2f2b72";
            g.fillRect(px, py, 1, 1);
          }
        }
      }
    }
    // cráteres
    g.fillStyle = "#d6cb9c";
    [[-3, -2], [-2, -2], [2, 2], [3, 2], [2, 3], [-1, 3], [-4, 1]].forEach(function (p) {
      g.fillRect(moon.x + p[0], moon.y + p[1], 1, 1);
    });

    // Estrellas (se dibujan en cada cuadro para que titilen)
    var nStars = Math.round(W * skyEnd * 0.007);
    for (var s = 0; s < nStars; s++) {
      var sx = Math.floor(R() * W), sy = Math.floor(R() * skyEnd * 0.92);
      var dx = sx - moon.x, dy = sy - moon.y;
      if (dx * dx + dy * dy < 400) continue;
      stars.push({ x: sx, y: sy, b: R() < 0.15 ? 2 : R() < 0.5 ? 1 : 0, tw: R() < 0.35, sp: 0.4 + R() * 1.6, ph: R() * 6.28, big: R() < 0.06 });
    }

    // Cerros: lejano, medio y cercano
    var far = ridgeFn(R, H * 0.47, H * 0.05);
    var mid = ridgeFn(R, H * 0.56, H * 0.065);
    var near = ridgeFn(R, H * 0.66, H * 0.07);
    hill(g, R, far, "#14173f", { w: [2, 2], h: [2, 2], density: 0.5, lit: 0.4, dim: 0.3 });
    hill(g, R, mid, "#1b1d4f", { w: [3, 4], h: [3, 3], density: 0.7, lit: 0.28, dim: 0.4 });
    hill(g, R, near, "#23235b", { w: [5, 7], h: [4, 6], density: 0.78, lit: 0.24, dim: 0.52, roof: true, dark: true });

    // Ascensor (funicular) subiendo el cerro cercano
    var x0 = Math.round(W * 0.2), x1 = x0 + Math.max(10, Math.round(H * 0.09));
    var y0 = shoreY - 2, y1 = near(x1) + 3;
    track = { x0: x0, y0: y0, x1: x1, y1: y1 };
    var steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (var i = 0; i <= steps; i++) {
      var tx = Math.round(x0 + (x1 - x0) * i / steps), ty = Math.round(y0 + (y1 - y0) * i / steps);
      g.fillStyle = "#17173f";
      g.fillRect(tx - 2, ty, 5, 1);
      g.fillStyle = "#7d84c4";
      g.fillRect(tx - 1, ty, 1, 1);
      g.fillRect(tx + 1, ty, 1, 1);
    }
    g.fillStyle = "#cfc6a6";
    g.fillRect(x0 - 3, y0 - 2, 7, 3);
    g.fillRect(x1 - 3, y1 - 3, 7, 3);

    // Costanera con faroles
    g.fillStyle = "#0e102e";
    g.fillRect(0, shoreY - 1, W, 3);
    for (var lx = 2; lx < W; lx += 5) {
      g.fillStyle = "#ffe08a";
      g.fillRect(lx, shoreY - 2, 1, 1);
      lights.push({ x: lx, y: shoreY - 2, c: "#ffe08a", off: false, lamp: true });
    }

    // Grúas del puerto
    var hc = Math.max(14, Math.round(H * 0.09));
    [0.73, 0.81, 0.89].forEach(function (f, k) {
      var cx = Math.round(W * f);
      g.fillStyle = "#090b22";
      g.fillRect(cx, shoreY - hc, 1, hc);
      g.fillRect(cx + 5, shoreY - hc, 1, hc);
      g.fillRect(cx - 1, shoreY - hc, 8, 2);
      g.fillRect(cx + 1, shoreY - Math.round(hc * 0.55), 4, 1);
      g.fillRect(cx - 9 - k, shoreY - hc - 3, 24, 1);
      g.fillRect(cx + 2, shoreY - hc - 6, 1, 6);
      cranes.push({ x: cx + 2, y: shoreY - hc - 7, ph: k * 1.3 });
    });

    // Mar
    dither(g, shoreY + 2, H, SEA);

    // Columnas de reflejo de las luces de la costa
    var candidates = lights.filter(function (l) { return l.lamp || l.y > shoreY - 18; });
    for (var r = 0; r < candidates.length; r += 3) {
      var L = candidates[r];
      reflections.push({ x: L.x, c: L.c === "#ffab5a" ? "#6e4a28" : "#7d6c38", len: 2 + Math.floor(R() * 5), seed: Math.floor(R() * 1000) });
    }

    // Botes
    for (var b = 0; b < 2; b++) {
      boats.push({ x: R() * W, y: shoreY + 8 + Math.floor(R() * Math.max(6, H - shoreY - 18)), v: (0.04 + R() * 0.05) * (b ? -1 : 1), c: b ? "#ff5d6c" : "#5ef0a0" });
    }
  }

  function hash(n) {
    n = (n << 13) ^ n;
    return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
  }

  function draw(t) {
    ctx.drawImage(base, 0, 0);
    var sec = t / 1000;

    // Estrellas que titilan
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = s.b + (s.tw && Math.sin(sec * s.sp + s.ph) > 0.55 ? 1 : 0);
      ctx.fillStyle = a >= 2 ? "#ffffff" : a === 1 ? "#c3c9f2" : "#626aab";
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.big && a >= 2) {
        ctx.fillStyle = "#8f97d6";
        ctx.fillRect(s.x - 1, s.y, 1, 1); ctx.fillRect(s.x + 1, s.y, 1, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 1); ctx.fillRect(s.x, s.y + 1, 1, 1);
      }
    }

    // Estrella fugaz de vez en cuando
    if (!meteor && Math.random() < 0.004) {
      meteor = { x: W * (0.1 + Math.random() * 0.5), y: H * Math.random() * 0.2, life: 0 };
    }
    if (meteor) {
      for (var k = 0; k < 6; k++) {
        ctx.fillStyle = k === 0 ? "#ffffff" : k < 3 ? "#c3c9f2" : "#626aab";
        ctx.fillRect(Math.round(meteor.x - k * 2), Math.round(meteor.y - k), 2, 1);
      }
      meteor.x += 5; meteor.y += 2.5; meteor.life++;
      if (meteor.life > 14) meteor = null;
    }

    // Ventanas que se apagan y se encienden
    if (lights.length && Math.random() < 0.5) {
      var L = lights[Math.floor(Math.random() * lights.length)];
      if (!L.lamp) L.off = !L.off;
    }
    for (var j = 0; j < lights.length; j++) {
      if (lights[j].off) { ctx.fillStyle = "#15173a"; ctx.fillRect(lights[j].x, lights[j].y, 1, 1); }
    }

    // Reflejos en el mar
    var f = Math.floor(sec * 6);
    for (var r = 0; r < reflections.length; r++) {
      var rf = reflections[r];
      ctx.fillStyle = rf.c;
      for (var q = 0; q < rf.len; q++) {
        if (hash(rf.seed + q * 31 + f * 7) < 0.55) {
          var yq = shoreY + 3 + q * 2;
          if (yq < H) ctx.fillRect(rf.x + (hash(rf.seed + q + f) < 0.5 ? 0 : 1) - 1, yq, 1 + (q % 3 === 0 ? 1 : 0), 1);
        }
      }
    }

    // Reflejo de la luna
    var span = H - shoreY;
    for (var y = shoreY + 3; y < H; y += 2) {
      var depth = (y - shoreY) / span;
      if (hash(y * 13 + f * 3) < 0.25) continue;
      var hw = 1 + Math.round(depth * 5);
      var jit = Math.round((hash(y * 7 + f) - 0.5) * 4);
      ctx.fillStyle = depth < 0.35 ? "#e6dcb0" : "#a39b78";
      ctx.fillRect(moon.x - hw + jit, y, Math.max(1, Math.round(hw * 2 * (0.4 + hash(y + f * 11) * 0.6))), 1);
    }

    // Carro del ascensor
    if (track) {
      var p = (Math.sin(sec * 0.25) + 1) / 2;
      var cx = Math.round(track.x0 + (track.x1 - track.x0) * p);
      var cy = Math.round(track.y0 + (track.y1 - track.y0) * p);
      ctx.fillStyle = "#e3523f";
      ctx.fillRect(cx - 2, cy - 4, 5, 4);
      ctx.fillStyle = "#ffe08a";
      ctx.fillRect(cx - 1, cy - 3, 1, 1);
      ctx.fillRect(cx + 1, cy - 3, 1, 1);
      ctx.fillStyle = "#7a2418";
      ctx.fillRect(cx - 2, cy - 1, 5, 1);
    }

    // Luces de las grúas
    for (var c = 0; c < cranes.length; c++) {
      if (Math.sin(sec * 2.2 + cranes[c].ph) > 0) {
        ctx.fillStyle = "#ff5d6c";
        ctx.fillRect(cranes[c].x, cranes[c].y, 1, 1);
      }
    }

    // Botes
    for (var b = 0; b < boats.length; b++) {
      var bt = boats[b];
      if (!reduce) {
        bt.x += bt.v;
        if (bt.x > W + 10) bt.x = -10;
        if (bt.x < -10) bt.x = W + 10;
      }
      var bx = Math.round(bt.x);
      ctx.fillStyle = "#070920";
      ctx.fillRect(bx, bt.y, 8, 2);
      ctx.fillRect(bx + 1, bt.y + 2, 6, 1);
      ctx.fillRect(bx + 3, bt.y - 2, 3, 2);
      ctx.fillStyle = Math.sin(sec * 3 + b) > -0.3 ? bt.c : "#3b2f4f";
      ctx.fillRect(bx + 4, bt.y - 3, 1, 1);
      ctx.fillStyle = "#5c4a2e";
      if (hash(b * 99 + f) < 0.7) ctx.fillRect(bx + 4, bt.y + 4, 1, 1);
    }
  }

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (now - last < 90) return;
    last = now;
    frame++;
    draw(now);
  }

  function start() {
    if (reduce || running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  function stop() { running = false; }

  function resize() {
    var vw = window.innerWidth || 1, vh = window.innerHeight || 1;
    H = Math.max(180, Math.min(620, Math.round(W * vh / vw)));
    canvas.width = W;
    canvas.height = H;
    build();
    draw(performance.now());
  }

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  resize();
  start();
})();
