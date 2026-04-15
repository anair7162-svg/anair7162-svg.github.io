function saveRt(rd) {
  if (!TK || !S.uid) return;
  sbp("saved_routes", {
    user_id: S.uid,
    distance: rd.distance,
    duration: rd.duration,
    radius: W.rad,
    prefs: W.prefs,
    start_lat: S.startLL.lat,
    start_lng: S.startLL.lng,
    dest_type: W.dest
  }).then(function(res) {
    S.routes.unshift({
      id: (res && res.length) ? res[0].id : Date.now().toString(36),
      ts: new Date().toISOString(),
      distance: rd.distance,
      duration: rd.duration,
      radius: W.rad,
      prefs: JSON.parse(JSON.stringify(W.prefs)),
      startLatLng: {lat: S.startLL.lat, lng: S.startLL.lng},
      destType: W.dest
    });
  });
}

var CHL = ["Residential", "Main Roads", "Highway", "Roundabouts", "Parking", "Hills"];

(function() {
  var c = $("ml-ch");
  CHL.forEach(function(t) {
    var d = document.createElement("div");
    d.className = "ch";
    d.setAttribute("data-v", t.toLowerCase());
    d.textContent = t;
    d.addEventListener("click", function() { d.classList.toggle("on"); });
    c.appendChild(d);
  });
})();

$("adlog").addEventListener("click", function() {
  $("ml-dt").value = new Date().toISOString().split("T")[0];
  $("ml-du").value = "";
  $("ml-sp").value = S.profile.supervisor || "";
  $("ml-nt").value = "";
  document.querySelectorAll("#ml-ch .ch").forEach(function(c) { c.classList.remove("on"); });
  $("ml").classList.add("on");
});

$("ml-x").addEventListener("click", function() { $("ml").classList.remove("on"); });

$("ml-ok").addEventListener("click", function() {
  var dur = parseInt($("ml-du").value);
  if (!dur || dur < 1) { toast("Enter duration"); return; }
  var roads = [];
  document.querySelectorAll("#ml-ch .ch.on").forEach(function(c) {
    roads.push(c.getAttribute("data-v"));
  });
  var drivenKm = S.drivenKm || 0;
  var entry = {
    date: $("ml-dt").value,
    duration: dur,
    tod: $("ml-td").value,
    roads: roads,
    supervisor: $("ml-sp").value,
    notes: $("ml-nt").value,
    km: parseFloat(drivenKm.toFixed(1)) || 0
  };
  S.drivenKm = 0;
  if (TK && S.uid) {
    sbp("log_entries", {
      user_id: S.uid,
      date: entry.date,
      duration: entry.duration,
      time_of_day: entry.tod,
      road_types: entry.roads,
      supervisor: entry.supervisor,
      notes: entry.notes
    }).then(function(res) {
      entry.id = (res && res.length) ? res[0].id : Date.now().toString(36);
      S.logs.unshift(entry);
      $("ml").classList.remove("on");
      dLog();
      toast("Logged!");
    });
  } else {
    entry.id = Date.now().toString(36);
    S.logs.unshift(entry);
    $("ml").classList.remove("on");
    dLog();
    toast("Logged!");
  }
});

function dLog() {
  var dM = (S.profile.initial_day_min || 0), nM = (S.profile.initial_night_min || 0);
  S.logs.forEach(function(e) {
    if ((e.tod || "day") === "night") nM += e.duration;
    else dM += e.duration;
  });
  var dH = dM / 60, nH = nM / 60, tH = dH + nH;
  $("th").textContent = tH.toFixed(1);
  $("hbs").innerHTML =
    '<div class="hb"><div class="hv" style="color:var(--acc)">' + dH.toFixed(1) + 'h</div><div class="hl">Day (80h req)</div></div>' +
    '<div class="hb"><div class="hv" style="color:var(--i)">' + nH.toFixed(1) + 'h</div><div class="hl">Night (20h req)</div></div>';
  var circ = 2 * Math.PI * 70;
  $("rd").style.strokeDashoffset = String(circ * (1 - Math.min(dH / 100, 1) * 0.65));
  $("rn").style.strokeDashoffset = String(circ * (1 - Math.min(nH / 20, 1) * 0.35));
  var list = $("llist");
  if (!S.logs.length) {
    list.innerHTML = '<div class="empty"><div class="ei">\u2261</div><div style="font-size:14px;font-weight:600;color:var(--t2)">No entries</div></div>';
    return;
  }
  var h = "";
  S.logs.slice(0, 30).forEach(function(e, idx) {
    var n = (e.tod || "day") === "night";
    var bg = n ? "var(--ig)" : "var(--accg)";
    var col = n ? "var(--i)" : "var(--acc)";
    var ico = n ? "\u263E" : "\u2600";
    h += '<div class="card" style="cursor:default"><div class="cr">';
    h += '<div class="ci" style="background:' + bg + ';color:' + col + '">' + ico + '</div>';
    h += '<div class="cb"><div class="ct">' + fd(e.date) + '</div>';
    h += '<div class="cs">' + (e.supervisor ? "with " + e.supervisor : "");
    h += (e.roads && e.roads.length ? " \u00B7 " + e.roads.join(", ") : "") + '</div></div>';
    h += '<div class="crt"><div class="cv" style="color:' + col + '">' + e.duration + '</div><div class="cu">min</div></div>';
    h += '<button class="bg log-del" data-li="' + idx + '" style="color:var(--d);font-size:12px;padding:6px" title="Delete">\u2715</button>';
    h += '</div>';
    if (e.notes) {
      h += '<div style="margin-top:6px;font-size:11px;color:var(--t3);padding:6px 8px;background:var(--bg3);border-radius:6px">' + e.notes + '</div>';
    }
    h += '</div>';
  });
  list.innerHTML = h;
  list.querySelectorAll(".log-del").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var idx = parseInt(btn.getAttribute("data-li"));
      var entry = S.logs[idx];
      if (TK && S.uid && entry && entry.id) sbDel("log_entries", "id=eq." + entry.id);
      S.logs.splice(idx, 1);
      dLog();
      dProf();
      toast("Entry deleted");
    });
  });
}

function dRt() {
  var list = $("rlist"), em = $("nort");
  if (!S.routes.length) { list.innerHTML = ""; em.style.display = "block"; return; }
  em.style.display = "none";
  var h = "";
  S.routes.forEach(function(r, i) {
    var ds = "";
    try { ds = new Date(r.ts).toLocaleDateString("en-AU", {day: "numeric", month: "short", year: "numeric"}); } catch (e) {}
    h += '<div class="card" data-ri="' + i + '" style="position:relative"><div class="cr">';
    h += '<div class="ci" style="background:var(--accg);color:var(--acc)">\u2550</div>';
    h += '<div class="cb"><div class="ct">' + r.distance.toFixed(1) + ' km \u00B7 ' + Math.round(r.duration) + ' min</div>';
    h += '<div class="cs">' + ds + ' \u00B7 ' + (r.destType === "loop" ? "Loop" : "P2P") + ' \u00B7 ' + r.radius + 'km radius</div></div>';
    h += '<button class="bg rt-del" data-di="' + i + '" style="color:var(--d);font-size:14px;padding:8px" title="Delete">\u2717</button>';
    h += '</div></div>';
  });
  list.innerHTML = h;
  list.querySelectorAll("[data-ri]").forEach(function(c) {
    c.addEventListener("click", function(ev) {
      if (ev.target.closest(".rt-del")) return;
      var r = S.routes[parseInt(c.getAttribute("data-ri"))];
      if (!r) return;
      goTo("s-map");
      setTimeout(function() {
        clr();
        if (S.userLL) S.startLL = {lat: S.userLL.lat, lng: S.userLL.lng};
        else S.startLL = {lat: r.startLatLng.lat, lng: r.startLatLng.lng};
        sMk = L.marker([S.startLL.lat, S.startLL.lng], {icon: iS}).addTo(map);
        map.setView([S.startLL.lat, S.startLL.lng], 14);
        W.prefs = JSON.parse(JSON.stringify(r.prefs || {}));
        W.rad = r.radius || 5;
        W.dur = r.duration || 60;
        W.dest = r.destType || "loop";
        W.diff = 2;
        fetchWeather(S.startLL.lat, S.startLL.lng);
        toast("Rebuilding route...");
        S.genRoutes = [];
        S.genIdx = 0;
        S.poiCache = null;
        W.skipSave = true;
        doGen();
      }, 300);
    });
  });
  list.querySelectorAll(".rt-del").forEach(function(btn) {
    btn.addEventListener("click", function(ev) {
      ev.stopPropagation();
      var idx = parseInt(btn.getAttribute("data-di"));
      var route = S.routes[idx];
      if (!confirm("Delete this route?")) return;
      if (TK && S.uid && route.id) sbDel("saved_routes", "id=eq." + route.id);
      S.routes.splice(idx, 1);
      dRt();
      dProf();
      toast("Route deleted");
    });
  });
}

function dProf() {
  var nm = S.profile.name || "Driver";
  $("pnm").textContent = nm;
  var lt = S.profile.licence_type || "L";
  var ltLabels = {"L": "Learner", "P1": "P1 Red Provisional", "P2": "P2 Green Provisional"};
  $("pli").textContent = (ltLabels[lt] || lt) + " \u2014 NSW";
  $("xrt").textContent = S.routes.length;
  var totalKm = S.logs.reduce(function(s, e) { return s + (e.km || 0); }, 0);
  $("xkm").textContent = totalKm.toFixed(0);
  $("xhr").textContent = (
    S.logs.reduce(function(s, e) { return s + e.duration; }, 0) / 60 +
    (S.profile.initial_day_min || 0) / 60 +
    (S.profile.initial_night_min || 0) / 60
  ).toFixed(1);
  applyLicTheme();
  var pfpData = S.profile.pfp || "";
  var av = $("pav");
  if (pfpData) {
    av.innerHTML = '<img src="' + pfpData + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
  } else {
    av.textContent = nm[0].toUpperCase();
  }
}

$("pav").addEventListener("click", function() { $("pfp-input").click(); });

$("pfp-input").addEventListener("change", function() {
  var file = this.files[0];
  if (!file) return;
  if (file.size > 500000) { toast("Image too large (max 500KB)"); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    S.profile.pfp = e.target.result;
    try { localStorage.setItem("ll-pfp", e.target.result); } catch (x) {}
    dProf();
    toast("Photo updated!");
  };
  reader.readAsDataURL(file);
});

$("cedit").addEventListener("click", function() {
  $("mp-nm").value = S.profile.name || "";
  $("mp-li").value = S.profile.licence || "";
  $("mp-sp").value = S.profile.supervisor || "";
  $("mp-lt").value = S.profile.licence_type || "L";
  $("mp").classList.add("on");
});

$("mp-x").addEventListener("click", function() { $("mp").classList.remove("on"); });

$("mp-ok").addEventListener("click", function() {
  S.profile.name = $("mp-nm").value || "Driver";
  S.profile.licence = $("mp-li").value;
  S.profile.supervisor = $("mp-sp").value;
  S.profile.licence_type = $("mp-lt").value;
  if (TK && S.uid) {
    sbu("profiles", "id=eq." + S.uid, {
      name: S.profile.name,
      licence: S.profile.licence,
      supervisor: S.profile.supervisor,
      licence_type: S.profile.licence_type
    });
  }
  $("mp").classList.remove("on");
  dProf();
  toast("Updated");
});

$("cexp").addEventListener("click", function() {
  var d = {
    profile: S.profile,
    logs: S.logs,
    routes: S.routes,
    date: new Date().toISOString()
  };
  var b = new Blob([JSON.stringify(d, null, 2)], {type: "application/json"});
  var a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = "elearnsio-export.json";
  a.click();
  toast("Exported");
});

$("cout").addEventListener("click", function() {
  if (TK) {
    fetch(SB + "/auth/v1/logout", {
      method: "POST",
      headers: {"apikey": AK, "Authorization": "Bearer " + TK}
    }).catch(function() {});
  }
  TK = null;
  S.uid = null;
  S.logs = [];
  S.routes = [];
  clearSession();
  $("auth").classList.remove("gone");
  $("app").classList.remove("on");
});
