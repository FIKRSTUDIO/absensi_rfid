(function () {
  "use strict";
  var UBAH_JADWAL_DZUHUR = { time: "11:36", end: "14:52" };
  var UBAH_DAFTAR_KARTU = { "UBAH_UID_KARTU": "UBAH NAMA SISWA" };
  var UID_SISWA = Object.keys(UBAH_DAFTAR_KARTU)[0];
  var UID_KARTU_ASING = "9F10C7D2";
  var UBAH_ISI_DATA_CONTOH = true;
  var STORE_KEY = "presensi-dzuhur-v1";

  var state = { taps: {}, cleared: {} };
  try { var raw = localStorage.getItem(STORE_KEY); if (raw) state = JSON.parse(raw) || state; } catch (e) {}
  if (!state.taps) state.taps = {};
  if (!state.cleared) state.cleared = {};
  function persist() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  var $ = function (id) { return document.getElementById(id); };
  var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
  function dayKey(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function toMin(hm) { var p = hm.split(":"); return +p[0] * 60 + +p[1]; }
  function nowMin(d) { return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }
  function hm(min) { return pad2(Math.floor(min / 60)) + ":" + pad2(Math.floor(min % 60)); }
  function isWeekday(d) { var w = d.getDay(); return w > 0 && w < 6; }
  function fmtUid(u) { return u.replace(/(..)(?=.)/g, "$1:"); }

  function seedMin(d) { return 12 * 60 + 2 + ((d.getDate() * 7 + d.getMonth() * 5) % 22); }

  function getRecord(d, now) {
    var key = dayKey(d);
    if (state.taps[key]) return state.taps[key];
    if (state.cleared[key] || !isWeekday(d) || !UBAH_ISI_DATA_CONTOH) return null;
    var todayKey = dayKey(now);
    if (key < todayKey || (key === todayKey && nowMin(now) >= seedMin(d))) {
      return { t: hm(seedMin(d)), uid: UID_SISWA, late: false, seeded: true };
    }
    return null;
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }

  function renderDate() {
    var d = new Date(), txt = "";
    try { txt = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d); } catch (e) { txt = d.toDateString(); }
    try { txt += " · " + new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(d); } catch (e) {}
    $("dateline").textContent = txt;
  }

  function renderNext() {
    var now = new Date(), m = nowMin(now), card = $("next-card");
    var rec = getRecord(now, now), mode, eyebrow, name, count, note;
    if (!isWeekday(now)) {
      mode = "off"; eyebrow = "Akhir pekan"; name = "Libur"; count = "–";
      note = "Presensi Dzuhur berjalan Senin sampai Jumat.";
    } else if (rec) {
      mode = "done"; eyebrow = "Dzuhur hari ini"; name = "Tercatat"; count = rec.t;
      note = "Kartu ditempel pukul " + rec.t + (rec.late ? " (terlambat)" : "") + ".";
    } else if (m < toMin(UBAH_JADWAL_DZUHUR.time)) {
      var s1 = Math.round((toMin(UBAH_JADWAL_DZUHUR.time) - m) * 60);
      mode = "pending"; eyebrow = "Dzuhur hari ini"; name = "Belum masuk waktu"; count = clock(s1);
      note = "Masuk waktu pukul " + UBAH_JADWAL_DZUHUR.time + " WIB. Tempelkan kartu setelah sholat.";
    } else if (m < toMin(UBAH_JADWAL_DZUHUR.end)) {
      var s2 = Math.round((toMin(UBAH_JADWAL_DZUHUR.end) - m) * 60);
      mode = "pending"; eyebrow = "Dzuhur hari ini"; name = "Sedang waktunya"; count = clock(s2);
      note = "Belum tercatat. Waktu Dzuhur berakhir pukul " + UBAH_JADWAL_DZUHUR.end + ".";
    } else {
      mode = "missed"; eyebrow = "Dzuhur hari ini"; name = "Belum tercatat"; count = "–";
      note = "Waktu Dzuhur berakhir pukul " + UBAH_JADWAL_DZUHUR.end + ". Tap setelahnya dicatat sebagai terlambat.";
    }
    card.className = "card next" + (mode === "pending" ? "" : " " + mode);
    $("next-eyebrow").textContent = eyebrow;
    $("next-name").textContent = name;
    $("next-count").textContent = count;
    $("next-note").textContent = note;
  }
  function clock(secs) { return pad2(Math.floor(secs / 3600)) + ":" + pad2(Math.floor(secs % 3600 / 60)) + ":" + pad2(secs % 60); }

  var events = [];
  function renderLog() {
    var now = new Date(), rec = getRecord(now, now), rows = [];
    if (rec) rows.push({ sort: rec.t + ":00", t: rec.t, name: UBAH_DAFTAR_KARTU[rec.uid] || "Kartu " + fmtUid(rec.uid), uid: rec.uid, kind: rec.late ? "warn" : "ok", label: rec.late ? "Terlambat" : "Tercatat" });
    events.forEach(function (e) { rows.push({ sort: e.t, t: e.t, name: e.name || "Kartu tidak dikenal", uid: e.uid, kind: e.kind, label: e.label }); });
    rows.sort(function (a, b) { return a.sort < b.sort ? 1 : -1; });
    var ul = $("log-list"); ul.textContent = "";
    if (!rows.length) {
      var li0 = document.createElement("li"); li0.className = "empty"; li0.style.display = "block";
      li0.textContent = isWeekday(now) ? "Belum ada tap hari ini. Tempelkan kartu ke pembaca." : "Tidak ada presensi di akhir pekan.";
      ul.appendChild(li0);
    }
    rows.forEach(function (r) {
      var li = document.createElement("li");
      var t = document.createElement("span"); t.className = "l-time"; t.textContent = r.t;
      var mid = document.createElement("div");
      var n = document.createElement("div"); n.className = "l-name"; n.textContent = r.name;
      var u = document.createElement("div"); u.className = "l-uid"; u.textContent = "UID " + fmtUid(r.uid);
      mid.appendChild(n); mid.appendChild(u);
      var tag = document.createElement("span"); tag.className = "tag " + r.kind; tag.textContent = r.label;
      li.appendChild(t); li.appendChild(mid); li.appendChild(tag);
      ul.appendChild(li);
    });
    $("log-count").textContent = rows.length + " tap";
    if (rec) {
      var li2 = document.createElement("li");
      li2.style.display = "block"; li2.style.paddingTop = "8px";
      var undo = document.createElement("button"); undo.type = "button"; undo.className = "link-btn"; undo.textContent = "Batalkan catatan Dzuhur hari ini";
      undo.addEventListener("click", function () {
        var k = dayKey(new Date()); delete state.taps[k]; state.cleared[k] = true; persist(); renderAll(); toast("Catatan Dzuhur hari ini dibatalkan");
      });
      li2.appendChild(undo); ul.appendChild(li2);
    }
  }

  function renderHistory() {
    var now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var dow = (today.getDay() + 6) % 7, monday = new Date(today); monday.setDate(today.getDate() - dow);
    var body = $("history-body"); body.textContent = "";
    var days = 0, ok = 0, streakOpen = true, streak = 0, rowsData = [];
    var labels = ["Minggu ini", "Minggu lalu", "2 minggu lalu", "3 minggu lalu"];
    for (var w = 3; w >= 0; w--) {
      var ws = new Date(monday); ws.setDate(monday.getDate() - 7 * w);
      var we = new Date(ws); we.setDate(ws.getDate() + 4);
      var tr = document.createElement("tr");
      var h = document.createElement("td");
      h.appendChild(document.createTextNode(labels[w]));
      var sm = document.createElement("small");
      sm.textContent = ws.getDate() + "–" + we.getDate() + " " + new Intl.DateTimeFormat("id-ID", { month: "short" }).format(we);
      h.appendChild(sm); tr.appendChild(h);
      for (var i = 0; i < 5; i++) {
        var d = new Date(ws); d.setDate(ws.getDate() + i);
        var td = document.createElement("td"); td.className = "cell";
        var num = document.createElement("small"); num.textContent = d.getDate(); td.appendChild(num);
        var kind, rec = null, label;
        if (d > today) { kind = "wait"; label = "Belum tiba"; }
        else {
          rec = getRecord(d, now);
          if (rec) { kind = "yes"; label = "Tercatat " + rec.t; }
          else if (dayKey(d) === dayKey(now) && nowMin(now) < toMin(UBAH_JADWAL_DZUHUR.end)) { kind = "wait"; label = "Belum tercatat"; }
          else { kind = "no"; label = "Tidak tercatat"; }
        }
        if (kind !== "wait") { days++; if (kind === "yes") ok++; }
        if (dayKey(d) === dayKey(now)) td.className += " today";
        var mk = document.createElement("i"); mk.className = "mark " + kind; td.appendChild(mk);
        var sr = document.createElement("span"); sr.className = "sr"; sr.textContent = label; td.appendChild(sr);
        if (rec) { var tt = document.createElement("span"); tt.className = "t mono"; tt.textContent = rec.t; td.appendChild(tt); }
        tr.appendChild(td);
        rowsData.push({ d: d, kind: kind });
      }
      body.appendChild(tr);
    }
    for (var j = rowsData.length - 1; j >= 0; j--) {
      var r = rowsData[j];
      if (r.d > today) continue;
      if (r.kind === "yes") streak++;
      else if (r.kind === "wait") continue;
      else break;
    }
    var pct = days ? Math.round(ok / days * 100) : 0;
    $("pct").textContent = pct + "%";
    $("hist-sum").textContent = ok + " dari " + days + " hari sekolah tercatat";
    $("st-week").textContent = pct + "%";
    $("st-streak").textContent = streak;
    var tr0 = getRecord(now, now);
    $("st-today").textContent = tr0 ? tr0.t : "–";
  }

  function renderAll() { renderDate(); renderNext(); renderLog(); renderHistory(); }

  var padTimer;
  var PAD_DEFAULT = "Tempelkan kartu pelajar ke pembaca";
  function flash(kind, msg) {
    var p = $("pad"); p.classList.remove("ok", "err"); p.classList.add(kind);
    $("pad-msg").textContent = msg;
    clearTimeout(padTimer);
    padTimer = setTimeout(function () { p.classList.remove("ok", "err"); $("pad-msg").textContent = PAD_DEFAULT; }, 3200);
  }
  function stamp(d) { return pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds()); }

  function onTap(uid) {
    var now = new Date(), key = dayKey(now), name = UBAH_DAFTAR_KARTU[uid] || null;
    if (!name) {
      events.push({ t: stamp(now), uid: uid, name: null, kind: "err", label: "Ditolak" });
      flash("err", "Kartu tidak dikenal"); renderLog(); return;
    }
    if (!isWeekday(now)) {
      events.push({ t: stamp(now), uid: uid, name: name, kind: "err", label: "Libur" });
      flash("err", "Hari ini libur, presensi tidak dicatat"); renderLog(); return;
    }
    var rec = getRecord(now, now);
    if (rec) {
      events.push({ t: stamp(now), uid: uid, name: name, kind: "warn", label: "Sudah tercatat" });
      flash("ok", "Sudah tercatat pukul " + rec.t); renderLog(); return;
    }
    delete state.cleared[key];
    state.taps[key] = { t: hm(nowMin(now)), uid: uid, late: nowMin(now) >= toMin(UBAH_JADWAL_DZUHUR.end) };
    persist(); renderAll();
    flash("ok", name + " tercatat pukul " + state.taps[key].t);
  }

  function handleLine(line) {
    var m = /^UID\s*[:=]\s*([0-9A-Fa-f :\-]+)$/.exec(line.trim());
    if (!m) return;
    var uid = m[1].replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    if (uid) onTap(uid);
  }

  var port = null, reader = null, closing = false;
  function setReader(on) {
    $("rd-chip").classList.toggle("on", on);
    $("rd-chip-text").textContent = on ? "Pembaca terhubung" : "Belum terhubung";
    $("pad").classList.toggle("live", on);
    $("rd-connect").textContent = on ? "Putuskan pembaca" : "Hubungkan pembaca";
    $("rd-connect").classList.toggle("primary", !on);
  }
  function connectReader() {
    if (port) { disconnectReader(); return; }
    if (!navigator.serial) { toast("Browser ini belum mendukung Web Serial. Pakai Chrome atau Edge di komputer."); return; }
    navigator.serial.requestPort().then(function (p) {
      port = p;
      return port.open({ baudRate: 9600 });
    }).then(function () {
      setReader(true); readLoop();
    }).catch(function (e) {
      port = null; setReader(false);
      if (!e || e.name !== "NotFoundError") toast("Tidak bisa membuka port pembaca");
    });
  }
  function disconnectReader() {
    closing = true;
    if (reader) { reader.cancel().catch(function () {}); }
  }
  async function readLoop() {
    var dec = new TextDecoder(), buf = "";
    try {
      while (port && port.readable) {
        reader = port.readable.getReader();
        try {
          while (true) {
            var r = await reader.read();
            if (r.done) break;
            buf += dec.decode(r.value, { stream: true });
            var i;
            while ((i = buf.indexOf("\n")) >= 0) { handleLine(buf.slice(0, i)); buf = buf.slice(i + 1); }
          }
        } finally { reader.releaseLock(); reader = null; }
        if (closing) break;
      }
    } catch (e) {}
    try { if (port) await port.close(); } catch (e) {}
    port = null; closing = false; setReader(false);
  }
  if (navigator.serial && navigator.serial.addEventListener) {
    navigator.serial.addEventListener("disconnect", function () { disconnectReader(); });
  }

  $("rd-connect").addEventListener("click", connectReader);
  $("rd-sim").addEventListener("click", function () { onTap(UID_SISWA); });
  $("rd-sim-bad").addEventListener("click", function () { onTap(UID_KARTU_ASING); });
  if (!navigator.serial) {
    $("rd-hint").textContent = "Browser ini belum mendukung Web Serial, jadi pembaca fisik tidak bisa dihubungkan. Pakai Chrome atau Edge di komputer. Tombol simulasi tetap bisa dipakai.";
  }

  function showTab(name) {
    ["today", "history", "profile"].forEach(function (n) {
      var on = n === name;
      $("tab-" + n).hidden = !on;
      $("t-" + n).setAttribute("aria-selected", on ? "true" : "false");
    });
    renderAll();
  }
  document.querySelectorAll(".tab").forEach(function (b) {
    b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); });
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (a) e.preventDefault();
  });

  $("note-contoh").hidden = !UBAH_ISI_DATA_CONTOH;
  renderAll();
  setInterval(renderNext, 1000);
  setInterval(function () { renderLog(); renderHistory(); }, 30000);
})();
