/* ═══════════════════════════════════════════════════════════════
   MENTLIFY — app.js
   Firebase v10 (Auth + Firestore) · Cloudinary (Images + Videos)
   Single-Page App · Hash Routing · Admin Panel
═══════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────────
//  FIREBASE IMPORTS  (modular v10 — no compat SDK)
// ─────────────────────────────────────────────────────────────
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore, collection, doc,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// NOTE: Firebase Storage NOT imported — Cloudinary handles all media.

// ─────────────────────────────────────────────────────────────
//  FIREBASE INIT
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyBDwxkMEdnFfKz2APaGzR7HBVoWKdOJoro",
  authDomain:        "mentlify-admin.firebaseapp.com",
  projectId:         "mentlify-admin",
  storageBucket:     "mentlify-admin.firebasestorage.app",
  messagingSenderId: "1091353856466",
  appId:             "1:1091353856466:web:bbb41295e7dcd26341200b",
  measurementId:     "G-5QQNN2VYQ0"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

console.log("Firebase Connected Successfully");

// ─────────────────────────────────────────────────────────────
//  CLOUDINARY CONFIG
// ─────────────────────────────────────────────────────────────
const CDN = {
  cloudName:    "deiqcdps2",
  uploadPreset: "mentlify_upload",
  imageUrl:     "https://api.cloudinary.com/v1_1/deiqcdps2/image/upload",
  videoUrl:     "https://api.cloudinary.com/v1_1/deiqcdps2/video/upload"
};

// ─────────────────────────────────────────────────────────────
//  CLOUDINARY UPLOAD — SINGLE IMAGE
//  Only ONE uploadImage function exists in the entire codebase.
// ─────────────────────────────────────────────────────────────
async function uploadImage(file, onProgress) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CDN.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CDN.imageUrl);
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error("Image upload failed (" + xhr.status + ")"));
      }
    };
    xhr.onerror = () => reject(new Error("Image upload network error"));
    xhr.send(fd);
  });
}

// ─────────────────────────────────────────────────────────────
//  CLOUDINARY UPLOAD — SINGLE VIDEO
//  Only ONE uploadVideo function exists in the entire codebase.
// ─────────────────────────────────────────────────────────────
async function uploadVideo(file, onProgress) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CDN.uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", CDN.videoUrl);
    if (onProgress) {
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error("Video upload failed (" + xhr.status + ")"));
      }
    };
    xhr.onerror = () => reject(new Error("Video upload network error"));
    xhr.send(fd);
  });
}

// ─────────────────────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────────────────────
const WA  = "918710022872";
let me    = null;
let curTab = "";

// ─────────────────────────────────────────────────────────────
//  TOAST NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
function toast(msg, type, ms) {
  type = type || "info";
  ms   = ms   || 3200;
  const stack = document.getElementById("toastStack");
  if (!stack) return;
  const d    = document.createElement("div");
  const icon = type === "ok" ? "check-circle" : type === "err" ? "times-circle" : "info-circle";
  d.className = "toast" + (type === "ok" ? " ok" : type === "err" ? " err" : "");
  d.innerHTML = '<i class="fas fa-' + icon + '"></i>' + msg;
  stack.appendChild(d);
  setTimeout(function() {
    d.style.cssText = "opacity:0;transform:translateX(28px);transition:.28s";
    setTimeout(function() { d.remove(); }, 280);
  }, ms);
}

// ─────────────────────────────────────────────────────────────
//  WHATSAPP
// ─────────────────────────────────────────────────────────────
function wa(msg) {
  toast("Opening WhatsApp\u2026");
  setTimeout(function() {
    window.open("https://wa.me/" + WA + "?text=" + msg, "_blank");
  }, 350);
}
window.offerCTA  = function() { wa(encodeURIComponent("Hi Mentlify, I want to apply and get FREE personal mentor guidance!")); };
window.laptopCTA = function() { wa(encodeURIComponent("Hi Mentlify, I want to know about the special laptop reward for college admissions (valid till 25th May)!")); };

// ─────────────────────────────────────────────────────────────
//  DRAWER — MOBILE NAV
//  FIX: classList.add/remove("open") — matches .drawer.open in CSS
// ─────────────────────────────────────────────────────────────
window.openDrawer = function() {
  var drawer = document.getElementById("drawer");
  if (drawer) { drawer.classList.add("open"); document.body.style.overflow = "hidden"; }
};
window.closeDrawer = function() {
  var drawer = document.getElementById("drawer");
  if (drawer) { drawer.classList.remove("open"); document.body.style.overflow = ""; }
};

document.addEventListener("click", function(e) {
  if (e.target.classList.contains("drw-bg")) window.closeDrawer();
});

// ─────────────────────────────────────────────────────────────
//  SIDEBAR TOGGLE (admin panel mobile)
//  FIX: Toggles .open class — CSS at max-width:900px: .sidebar.open{left:0}
// ─────────────────────────────────────────────────────────────
window.toggleSB = function() {
  var sb = document.getElementById("admSB");
  if (sb) sb.classList.toggle("open");
};

// ─────────────────────────────────────────────────────────────
//  ROUTING
// ─────────────────────────────────────────────────────────────
window.addEventListener("hashchange", route);

// Entry point — fired by onAuthStateChanged once on load
// Also wires file inputs here since module scripts are deferred
// (DOMContentLoaded fires BEFORE module executes, so listeners
//  inside DOMContentLoaded never attach — fixed by using this hook)
onAuthStateChanged(auth, function(user) {
  me = user;
  updateAuthUI();
  wireFileInputs();
  route();
});

function route() {
  var h = location.hash || "#home";
  if (h.startsWith("#detail/")) { showDetail(h.slice(8)); return; }
  if (h.startsWith("#dash/"))   {
    if (!me) { location.hash = "#admin"; return; }
    showDash(h.slice(6));
    return;
  }
  switch (h) {
    case "#home":      showView("vHome");   loadHomeFeatured();    break;
    case "#browse":    showView("vBrowse"); loadBrowse();          break;
    case "#colleges":  showView("vBrowse"); loadBrowse("college"); break;
    case "#schools":   showView("vBrowse"); loadBrowse("school");  break;
    case "#coaching":  showView("vBrowse"); loadBrowse("coaching");break;
    case "#teachers":  showView("vBrowse"); loadBrowse("teacher"); break;
    case "#admin":     me ? (location.hash = "#dash/overview") : showView("vLogin"); break;
    case "#dashboard": if (!me) { location.hash = "#admin"; return; } showDash("overview"); break;
    default:           showView("vHome");   loadHomeFeatured();
  }
}

function showView(id) {
  document.querySelectorAll(".view").forEach(function(v) { v.classList.remove("on"); });
  var el = document.getElementById(id);
  if (el) { el.classList.add("on"); window.scrollTo(0, 0); }
  var pub   = document.getElementById("pubNav");
  var waBtn = document.querySelector(".wa-float");
  if (id === "vDash") {
    if (pub)   pub.style.display   = "none";
    if (waBtn) waBtn.style.display = "none";
  } else {
    if (pub)   pub.style.display   = "";
    if (waBtn) waBtn.style.display = "";
  }
}

function updateAuthUI() {
  var el = document.getElementById("navAdm");
  if (el) el.textContent = me ? "Dashboard" : "Admin";
}

// ─────────────────────────────────────────────────────────────
//  HOME
// ─────────────────────────────────────────────────────────────
async function loadHomeFeatured() {
  try {
    var snap = await getDocs(query(collection(db, "institutions"), orderBy("createdAt", "desc"), limit(6)));
    renderCards(snap.docs.map(function(d) { return Object.assign({id: d.id}, d.data()); }), "homeFeat");
    loadStats();
  } catch(e) { console.warn("loadHomeFeatured:", e.message); }
}

async function loadStats() {
  try {
    var snap = await getDocs(collection(db, "institutions"));
    var c = 0, s = 0, co = 0, t = 0;
    snap.forEach(function(d) {
      var tp = d.data().type || "";
      if (tp === "college") c++;
      else if (tp === "school") s++;
      else if (tp === "coaching") co++;
      else if (tp === "teacher") t++;
    });
    setText("stC", c+"+"); setText("stS", s+"+"); setText("stCo", co+"+"); setText("stT", snap.size+"+");
  } catch(e) { console.warn("loadStats:", e.message); }
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ─────────────────────────────────────────────────────────────
//  BROWSE
// ─────────────────────────────────────────────────────────────
async function loadBrowse(type, q, city) {
  type = type || "all"; q = q || ""; city = city || "";
  document.querySelectorAll(".tab-pill").forEach(function(p) {
    p.classList.toggle("on", p.dataset.t === (type || "all"));
  });
  var grid = document.getElementById("browseGrid");
  if (!grid) return;
  grid.innerHTML = '<div class="loader"><i class="fas fa-circle-notch spin"></i></div>';
  try {
    var snap  = await getDocs(query(collection(db, "institutions"), orderBy("createdAt", "desc")));
    var items = snap.docs.map(function(d) { return Object.assign({id: d.id}, d.data()); });
    if (type && type !== "all") items = items.filter(function(i) { return i.type === type; });
    if (q)    items = items.filter(function(i) { return (i.name + " " + (i.courses||[]).join(" ")).toLowerCase().includes(q.toLowerCase()); });
    if (city) items = items.filter(function(i) { return (i.location||"").toLowerCase().includes(city.toLowerCase()); });
    items.sort(function(a,b) { return (b.featured?1:0)-(a.featured?1:0); });
    var cnt = document.getElementById("browseCount");
    if (cnt) cnt.innerHTML = "Showing <strong>" + items.length + "</strong> result" + (items.length!==1?"s":"");
    renderCards(items, "browseGrid");
  } catch(e) {
    grid.innerHTML = '<div class="empty-box"><i class="fas fa-exclamation-triangle"></i><p>Error loading data — check Firebase rules.<br><small>' + e.message + '</small></p></div>';
  }
}

window.doSearch = function() {
  var q    = (document.getElementById("srchQ")    || {}).value || "";
  var city = (document.getElementById("srchCity") || {}).value || "";
  var type = (document.getElementById("srchType") || {}).value || "all";
  loadBrowse(type, q, city);
};

// ─────────────────────────────────────────────────────────────
//  INSTITUTION CARDS
// ─────────────────────────────────────────────────────────────
function renderCards(items, gridId) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = '<div class="empty-box"><i class="fas fa-university"></i><p>No institutions found. Admin can add listings from the dashboard.</p></div>';
    return;
  }
  var GRADS = [
    "linear-gradient(135deg,#1a56db,#7c3aed)",
    "linear-gradient(135deg,#059669,#0891b2)",
    "linear-gradient(135deg,#f59e0b,#ef4444)",
    "linear-gradient(135deg,#8b5cf6,#6366f1)",
    "linear-gradient(135deg,#0ea5e9,#2563eb)",
    "linear-gradient(135deg,#ec4899,#8b5cf6)"
  ];
  var TMAP = {college:"tc", school:"ts", coaching:"tco", teacher:"tt"};
  grid.innerHTML = items.map(function(item, i) {
    var img      = (item.images||[])[0] || "";
    var tp       = (item.type||"").toLowerCase();
    var courses  = item.courses||[];
    var rf       = Math.min(5, Math.round(parseFloat(item.rating)||4.5));
    var stars    = "\u2605".repeat(rf) + "\u2606".repeat(5-rf);
    var grad     = GRADS[i % GRADS.length];
    var applyMsg = encodeURIComponent("Hi Mentlify, I am interested in " + (item.name||"") + ", Code: " + (item.code||""));
    return '<div class="icard" onclick="location.hash=\'#detail/' + item.id + '\'">' +
      '<div class="icard-img" style="background:' + grad + '1a">' +
        (img ? '<img src="' + img + '" alt="' + (item.name||"") + '" loading="lazy">'
             : '<div class="icard-ph" style="background:' + grad + ';width:100%;height:100%">' + (item.name||"?")[0].toUpperCase() + '</div>') +
        (item.featured ? '<div class="feat-badge">\u2B50 Featured</div>' : '') +
        '<div class="type-badge ' + (TMAP[tp]||"tc") + '">' + (item.type||"Institute") + '</div>' +
      '</div>' +
      '<div class="icard-body">' +
        '<div class="icard-name">' + (item.name||"Institute") + '</div>' +
        '<div class="icard-loc"><i class="fas fa-map-marker-alt"></i>' + (item.location||"") + '</div>' +
        '<div class="icard-stars">' + stars + ' <span style="font-size:.7rem;color:var(--faint)">(' + (item.reviewCount||"") + ')</span></div>' +
        '<div class="course-chips">' +
          courses.slice(0,3).map(function(c){return '<span class="ctag">'+(typeof c==="object"?c.name:c)+'</span>';}).join("") +
          (courses.length>3 ? '<span class="ctag">+' + (courses.length-3) + '</span>' : '') +
        '</div>' +
        '<div class="icard-footer">' +
          '<span class="icard-code">' + (item.code||"") + '</span>' +
          '<button class="btn btn-wa btn-sm" onclick="event.stopPropagation();wa(\'' + applyMsg + '\')">' +
            '<i class="fab fa-whatsapp"></i> Apply' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");
}

// ─────────────────────────────────────────────────────────────
//  DETAIL PAGE
// ─────────────────────────────────────────────────────────────
async function showDetail(id) {
  showView("vDetail");
  var wrap = document.getElementById("detWrap");
  wrap.innerHTML = '<div class="loader"><i class="fas fa-circle-notch spin"></i> Loading\u2026</div>';
  try {
    var snap = await getDoc(doc(db, "institutions", id));
    if (!snap.exists()) { wrap.innerHTML = "<p>Institution not found.</p>"; return; }
    renderDetail(Object.assign({id: snap.id}, snap.data()), wrap);
  } catch(e) {
    wrap.innerHTML = '<p style="color:red">Error: ' + e.message + '</p>';
  }
}

function renderDetail(d, wrap) {
  var images  = d.images  || [];
  var courses = d.courses || [];
  var facs    = d.facilities ? d.facilities.split(",").map(function(f){return f.trim();}).filter(Boolean) : [];
  var rf      = Math.min(5, Math.round(parseFloat(d.rating)||4.5));
  var stars   = "\u2605".repeat(rf) + "\u2606".repeat(5-rf);
  var applyMsg = encodeURIComponent("Hi Mentlify, I am interested in " + (d.name||"") + ", Code: " + (d.code||""));

  // Image slider
  var sliderHtml = "";
  if (images.length) {
    sliderHtml = '<div class="slider"><div class="slide-track" id="slTrk">' +
      images.map(function(u){ return '<div class="slide"><img src="' + u + '" alt="" loading="lazy"></div>'; }).join("") +
      '</div>' +
      (images.length > 1 ?
        '<button class="slarr sl-prev" onclick="slMov(-1)"><i class="fas fa-chevron-left"></i></button>' +
        '<button class="slarr sl-next" onclick="slMov(1)"><i class="fas fa-chevron-right"></i></button>' +
        '<div class="sldots">' +
          images.map(function(_,i){ return '<button class="sldot ' + (i===0?"on":"") + '" onclick="slTo(' + i + ')"></button>'; }).join("") +
        '</div>'
      : "") + '</div>';
  }

  // Course table
  var courseRows = courses.map(function(c) {
    var n  = typeof c === "object" ? c.name : c;
    var m  = typeof c === "object" ? c : {};
    var cm = encodeURIComponent("Hi Mentlify, I want admission in " + n + " at " + (d.name||"") + " (Code: " + (d.code||"") + ")");
    return '<tr>' +
      '<td><strong>' + n + '</strong></td>' +
      '<td>' + (m.duration||"—") + '</td>' +
      '<td>' + (m.fees||"—") + '</td>' +
      '<td>' + (m.eligibility||"—") + '</td>' +
      '<td>' + (m.seats||"—") + '</td>' +
      '<td><button class="btn btn-wa btn-sm" onclick="wa(\'' + cm + '\')"><i class="fab fa-whatsapp"></i></button></td>' +
    '</tr>';
  }).join("");

  wrap.innerHTML =
    '<button class="det-back" onclick="history.back()"><i class="fas fa-arrow-left"></i> Back</button>' +
    '<div class="det-hero"><div class="det-top">' +
      '<div class="det-logo">' + (images[0] ? '<img src="' + images[0] + '" alt="">' : '<div class="det-logo-ph">' + (d.name||"?")[0].toUpperCase() + '</div>') + '</div>' +
      '<div class="det-info">' +
        '<h2>' + (d.name||"") + '</h2>' +
        '<div style="opacity:.84;font-size:.82rem;margin-bottom:4px">' + (d.location||"") + '</div>' +
        '<div style="font-size:.84rem">' + stars + ' <strong>' + (d.rating||4.5) + '</strong></div>' +
        '<div class="det-meta">' +
          '<div class="det-tag"><i class="fas fa-school"></i>' + (d.type||"Institute") + '</div>' +
          (d.estYear ? '<div class="det-tag"><i class="fas fa-calendar"></i>Est. ' + d.estYear + '</div>' : '') +
          (d.code    ? '<div class="det-tag"><i class="fas fa-hashtag"></i>' + d.code + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div></div>' +
    sliderHtml +
    (d.videoUrl ? '<div class="det-video"><video controls playsinline preload="metadata"><source src="' + d.videoUrl + '">Your browser does not support video.</video></div>' : '') +
    (d.description ? '<div class="ds"><h3><i class="fas fa-info-circle"></i> About</h3><p>' + d.description + '</p></div>' : '') +
    (facs.length ? '<div class="ds"><h3><i class="fas fa-star"></i> Facilities</h3><div class="fac-pills">' + facs.map(function(f){return '<div class="fpill"><i class="fas fa-check-circle"></i>' + f + '</div>';}).join("") + '</div></div>' : '') +
    (courses.length ? '<div class="ds"><h3><i class="fas fa-graduation-cap"></i> Courses &amp; Fees</h3><div style="overflow-x:auto"><table class="ctable"><thead><tr><th>Course</th><th>Duration</th><th>Fees</th><th>Eligibility</th><th>Seats</th><th></th></tr></thead><tbody>' + courseRows + '</tbody></table></div></div>' : '') +
    (d.fees    ? '<div class="ds"><h3><i class="fas fa-rupee-sign"></i> Fee Info</h3><p>' + d.fees + '</p></div>'    : '') +
    (d.contact ? '<div class="ds"><h3><i class="fas fa-phone"></i> Contact</h3><p>' + d.contact + '</p></div>' : '') +
    '<div class="det-apply">' +
      '<div><h4>Ready to apply at ' + (d.name||"this institution") + '?</h4><p>Connect instantly on WhatsApp for admission guidance &amp; FREE mentor!</p></div>' +
      '<button class="btn btn-wa" onclick="wa(\'' + applyMsg + '\')"><i class="fab fa-whatsapp"></i> Book Now on WhatsApp</button>' +
    '</div>';

  window._slI = 0;
  window._slN = images.length;
}

window.slMov = function(dir) {
  window._slI = ((window._slI + dir) + window._slN) % window._slN;
  window.slTo(window._slI);
};
window.slTo = function(i) {
  window._slI = i;
  var t = document.getElementById("slTrk");
  if (t) t.style.transform = "translateX(-" + (i*100) + "%)";
  document.querySelectorAll(".sldot").forEach(function(d,j) { d.classList.toggle("on", j===i); });
};

// ─────────────────────────────────────────────────────────────
//  STUDENT LEAD FORM
// ─────────────────────────────────────────────────────────────
window.submitLead = async function() {
  var n  = getVal("lName"), p = getVal("lPhone"), c = getVal("lCourse"),
      b  = getVal("lBudget"), ci = getVal("lCity");
  if (!n||!p||!c) { toast("Please fill all required fields", "err"); return; }
  if (p.replace(/\D/g,"").length < 10) { toast("Enter a valid 10-digit number", "err"); return; }
  try {
    await addDoc(collection(db,"leads"), {
      name:n, phone:p, course:c, budget:b, city:ci,
      createdAt:serverTimestamp(), status:"new"
    });
    toast("Enquiry submitted! Opening WhatsApp\u2026", "ok");
    var msg = encodeURIComponent("Name: "+n+"\nPhone: "+p+"\nCourse: "+c+"\nBudget: "+b+"\nCity: "+ci);
    setTimeout(function(){ wa(msg); }, 700);
    ["lName","lPhone","lBudget","lCity"].forEach(function(id){ var el=document.getElementById(id); if(el)el.value=""; });
    var lc = document.getElementById("lCourse"); if(lc) lc.value = "";
  } catch(e) { toast("Error: " + e.message, "err"); }
};

// ─────────────────────────────────────────────────────────────
//  ADMIN LOGIN / LOGOUT
// ─────────────────────────────────────────────────────────────
window.doLogin = async function() {
  var email = getVal("aEmail"), pass = getVal("aPass");
  var errEl = document.getElementById("aErr"), btn = document.getElementById("lBtn");
  if (!email||!pass) { errEl.style.display="block"; errEl.textContent="Enter email and password."; return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Logging in\u2026';
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    toast("Welcome back!", "ok");
    location.hash = "#dashboard";
  } catch(e) {
    errEl.style.display = "block";
    errEl.textContent = ["auth/user-not-found","auth/wrong-password","auth/invalid-credential"].includes(e.code)
      ? "Invalid email or password."
      : e.code === "auth/too-many-requests"
        ? "Too many attempts. Try later."
        : e.message;
    btn.disabled  = false;
    btn.innerHTML = '<i class="fas fa-lock"></i> Login to Dashboard';
  }
};

window.doLogout = async function() {
  await signOut(auth);
  toast("Logged out", "ok");
  location.hash = "#home";
};

// ─────────────────────────────────────────────────────────────
//  ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────
function showDash(sec) {
  showView("vDash");
  var emailEl = document.getElementById("dashUserEmail");
  if (emailEl) emailEl.textContent = (me && me.email) ? me.email : "Admin";
  document.querySelectorAll(".sb-menu a").forEach(function(a){ a.classList.toggle("on", a.dataset.s===sec); });
  var titleEl = document.getElementById("dashTitle");
  if (titleEl) titleEl.textContent = sec.charAt(0).toUpperCase() + sec.slice(1);
  var content = document.getElementById("dashContent");
  content.innerHTML = '<div class="loader"><i class="fas fa-circle-notch spin"></i> Loading\u2026</div>';
  curTab = sec;
  switch(sec) {
    case "overview": renderOverview(content); break;
    case "college":  renderInstTab(content,"college","Colleges"); break;
    case "school":   renderInstTab(content,"school","Schools"); break;
    case "coaching": renderInstTab(content,"coaching","Coaching Centers"); break;
    case "teacher":  renderInstTab(content,"teacher","Tuition Teachers"); break;
    case "leads":    renderLeads(content); break;
    default: content.innerHTML = "<p>Section not found.</p>";
  }
}
window.showDash = showDash;

async function renderOverview(c) {
  try {
    var results = await Promise.all([
      getDocs(query(collection(db,"institutions"), where("type","==","college"))),
      getDocs(query(collection(db,"institutions"), where("type","==","school"))),
      getDocs(query(collection(db,"institutions"), where("type","==","coaching"))),
      getDocs(query(collection(db,"institutions"), where("type","==","teacher"))),
      getDocs(collection(db,"leads")),
    ]);
    var col=results[0], sch=results[1], coa=results[2], tea=results[3], lds=results[4];
    c.innerHTML =
      '<div class="adm-stats">' +
        '<div class="astat"><div class="ai">\uD83C\uDFEB</div><span class="an">'+col.size+'</span><div class="al">Colleges</div></div>' +
        '<div class="astat"><div class="ai">\uD83C\uDFE2</div><span class="an">'+sch.size+'</span><div class="al">Schools</div></div>' +
        '<div class="astat"><div class="ai">\uD83D\uDCDA</div><span class="an">'+coa.size+'</span><div class="al">Coaching</div></div>' +
        '<div class="astat"><div class="ai">\uD83D\uDC69\u200D\uD83C\uDFEB</div><span class="an">'+tea.size+'</span><div class="al">Teachers</div></div>' +
        '<div class="astat"><div class="ai">\uD83D\uDCE5</div><span class="an">'+lds.size+'</span><div class="al">Leads</div></div>' +
      '</div>' +
      '<div class="adm-tbl-wrap"><div class="adm-tbl-head"><h3><i class="fas fa-bolt"></i> Quick Actions</h3></div>' +
      '<div style="padding:16px;display:flex;flex-wrap:wrap;gap:9px">' +
        '<button class="btn btn-grad btn-sm" onclick="showDash(\'college\')"><i class="fas fa-university"></i> Colleges</button>' +
        '<button class="btn btn-grad btn-sm" onclick="showDash(\'school\')"><i class="fas fa-school"></i> Schools</button>' +
        '<button class="btn btn-grad btn-sm" onclick="showDash(\'coaching\')"><i class="fas fa-chalkboard-teacher"></i> Coaching</button>' +
        '<button class="btn btn-grad btn-sm" onclick="showDash(\'teacher\')"><i class="fas fa-user-tie"></i> Teachers</button>' +
        '<button class="btn btn-grad btn-sm" onclick="showDash(\'leads\')"><i class="fas fa-inbox"></i> Leads</button>' +
      '</div></div>' +
      '<div class="adm-tbl-wrap" style="margin-top:14px"><div class="adm-tbl-head"><h3><i class="fas fa-shield-alt"></i> Firestore Rules</h3></div>' +
      '<div style="padding:16px;font-size:.79rem;background:#0f172a;color:#86efac;border-radius:0 0 12px 12px;font-family:monospace;line-height:1.7;overflow-x:auto">' +
      'rules_version = \'2\';<br>service cloud.firestore {<br>&nbsp;&nbsp;match /databases/{db}/documents {<br>&nbsp;&nbsp;&nbsp;&nbsp;match /institutions/{doc} {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if true;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow write: if request.auth != null;<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;&nbsp;&nbsp;match /leads/{doc} {<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read: if request.auth != null;<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow create: if true;<br>&nbsp;&nbsp;&nbsp;&nbsp;}<br>&nbsp;&nbsp;}<br>}' +
      '</div></div>';
  } catch(e) { c.innerHTML = '<p style="color:red">Error: ' + e.message + '</p>'; }
}

async function renderInstTab(c, type, title) {
  try {
    var snap  = await getDocs(query(collection(db,"institutions"), where("type","==",type), orderBy("createdAt","desc")));
    var items = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    var rows  = items.length ? items.map(function(it) {
      var img = (it.images||[])[0]||"";
      return '<tr>' +
        '<td>' + (img ? '<img class="tbl-logo" src="'+img+'" alt="">' : '<div class="tbl-logo-ph">'+(it.name||"?")[0].toUpperCase()+'</div>') + '</td>' +
        '<td><div class="tbl-name">'+(it.name||"")+'</div></td>' +
        '<td>'+(it.location||"")+'</td>' +
        '<td><span class="icard-code">'+(it.code||"")+'</span></td>' +
        '<td>'+(it.featured?'<span class="f-yes">\u2605 Yes</span>':'<span class="f-no">No</span>')+'</td>' +
        '<td><div class="tact">' +
          '<button class="btn-edit" onclick="openEditModal(\''+it.id+'\')"><i class="fas fa-pen"></i> Edit</button>' +
          '<button class="btn-del"  onclick="delInst(\''+it.id+'\',\''+type+'\')"><i class="fas fa-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
    }).join("") : '<tr><td colspan="6" style="text-align:center;padding:28px;color:var(--faint)">No '+title+' yet. Click "Add New" to start.</td></tr>';
    c.innerHTML =
      '<div class="adm-tbl-wrap">' +
        '<div class="adm-tbl-head"><h3><i class="fas fa-list"></i> '+title+' ('+items.length+')</h3>' +
          '<button class="btn btn-grad btn-sm" onclick="openAddModal(\''+type+'\')"><i class="fas fa-plus"></i> Add New</button>' +
        '</div>' +
        '<div class="tbl-scroll"><table class="atbl">' +
          '<thead><tr><th>Logo</th><th>Name</th><th>Location</th><th>Code</th><th>Featured</th><th>Actions</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
      '</div>';
  } catch(e) { c.innerHTML = '<p style="color:red">Error: ' + e.message + '</p>'; }
}

async function renderLeads(c) {
  try {
    var snap  = await getDocs(query(collection(db,"leads"), orderBy("createdAt","desc"), limit(150)));
    var items = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
    var rows  = items.length ? items.map(function(l) {
      var dt  = l.createdAt && l.createdAt.toDate ? l.createdAt.toDate() : null;
      var ds  = dt ? dt.toLocaleDateString("en-IN") : "—";
      var msg = encodeURIComponent("Hi "+(l.name||"")+", this is Mentlify. You enquired about "+(l.course||"")+". How can we assist?");
      return '<tr>' +
        '<td><strong>'+(l.name||"")+'</strong></td><td>'+(l.phone||"")+'</td><td>'+(l.course||"")+'</td>' +
        '<td>'+(l.budget||"—")+'</td><td>'+(l.city||"—")+'</td><td>'+ds+'</td>' +
        '<td><button class="btn btn-wa btn-sm" onclick="wa(\''+msg+'\')"><i class="fab fa-whatsapp"></i></button></td>' +
      '</tr>';
    }).join("") : '<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--faint)">No leads yet.</td></tr>';
    c.innerHTML =
      '<div class="adm-tbl-wrap">' +
        '<div class="adm-tbl-head"><h3><i class="fas fa-inbox"></i> Student Leads ('+items.length+')</h3></div>' +
        '<div class="tbl-scroll"><table class="atbl">' +
          '<thead><tr><th>Name</th><th>Phone</th><th>Course</th><th>Budget</th><th>City</th><th>Date</th><th>Reply</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
      '</div>';
  } catch(e) { c.innerHTML = '<p style="color:red">Error: ' + e.message + '</p>'; }
}

// ─────────────────────────────────────────────────────────────
//  INSTITUTION FORM STATE
// ─────────────────────────────────────────────────────────────
var fMode     = "add";
var fDocId    = null;
var fType     = "";
var existImgs = [];   // Cloudinary URLs already saved in Firestore
var selImgs   = [];   // new File objects pending upload
var selVid    = null; // new video File pending upload

// ─────────────────────────────────────────────────────────────
//  WIRE FILE INPUTS
//  Called from onAuthStateChanged (not DOMContentLoaded) because
//  type="module" defers execution until after DOMContentLoaded.
// ─────────────────────────────────────────────────────────────
function wireFileInputs() {
  var imgInput = document.getElementById("fImgs");
  var vidInput = document.getElementById("fVid");

  if (imgInput && !imgInput._wired) {
    imgInput._wired = true;
    imgInput.addEventListener("change", function() {
      var newFiles = Array.from(this.files);
      selImgs = selImgs.concat(newFiles);
      var pw = document.getElementById("imgPrvs");
      if (!pw) return;
      newFiles.forEach(function(f) {
        var rd = new FileReader();
        rd.onload = function(e) {
          var div = document.createElement("div");
          div.className = "pitem";
          div.innerHTML = '<img src="' + e.target.result + '" alt=""><button class="p-rm" onclick="this.parentElement.remove()">x</button>';
          pw.appendChild(div);
        };
        rd.readAsDataURL(f);
      });
    });
  }

  if (vidInput && !vidInput._wired) {
    vidInput._wired = true;
    vidInput.addEventListener("change", function() {
      selVid = this.files[0] || null;
      if (selVid) {
        var p = document.getElementById("vPrv");
        if (p) { p.src = URL.createObjectURL(selVid); p.style.display = "block"; }
      }
    });
  }
}

// ─────────────────────────────────────────────────────────────
//  OPEN ADD MODAL
// ─────────────────────────────────────────────────────────────
function openAddModal(type) {
  fMode = "add"; fDocId = null; fType = type;
  existImgs = []; selImgs = []; selVid = null;
  resetForm();
  setVal("fType", type);
  document.getElementById("modalTitle").textContent = "Add " + cap(type);
  document.getElementById("fOverlay").classList.add("open");
}
window.openAddModal = openAddModal;

// ─────────────────────────────────────────────────────────────
//  OPEN EDIT MODAL
// ─────────────────────────────────────────────────────────────
window.openEditModal = async function(id) {
  try {
    var snap = await getDoc(doc(db, "institutions", id));
    if (!snap.exists()) { toast("Institution not found", "err"); return; }
    var d = snap.data();
    fMode     = "edit";
    fDocId    = id;
    fType     = d.type || "college";
    existImgs = (d.images || []).slice(); // copy
    selImgs   = [];
    selVid    = null;
    resetForm();
    setVal("fName",       d.name        || "");
    setVal("fType",       d.type        || "college");
    setVal("fLocation",   d.location    || "");
    setVal("fCode",       d.code        || "");
    setVal("fRating",     d.rating      || "");
    setVal("fEstYear",    d.estYear     || "");
    setVal("fDesc",       d.description || "");
    setVal("fFacilities", d.facilities  || "");
    setVal("fFees",       d.fees        || "");
    setVal("fContact",    d.contact     || "");
    setVal("fRevCount",   d.reviewCount || "");
    var fc = document.getElementById("fFeatured");
    if (fc) fc.checked = !!d.featured;
    setVal("fCourses", (d.courses||[]).map(function(c){ return typeof c==="object" ? JSON.stringify(c) : c; }).join("\n") || "");
    refreshExistImgs();
    document.getElementById("modalTitle").textContent = "Edit \u2014 " + (d.name||"");
    document.getElementById("fOverlay").classList.add("open");
  } catch(e) { toast("Error opening form: " + e.message, "err"); }
};

// ─────────────────────────────────────────────────────────────
//  EXISTING IMAGE MANAGEMENT
// ─────────────────────────────────────────────────────────────
function refreshExistImgs() {
  var ew = document.getElementById("exImgWrap");
  if (!ew) return;
  ew.innerHTML = existImgs.map(function(url, i) {
    return '<div class="pitem"><img src="'+url+'" alt=""><button class="p-rm" onclick="rmExImg('+i+')" title="Remove">x</button></div>';
  }).join("");
}

// Remove an existing saved image by index — updates array and re-renders
window.rmExImg = function(i) {
  existImgs.splice(i, 1);
  refreshExistImgs();
};

// ─────────────────────────────────────────────────────────────
//  CLOSE MODAL / RESET FORM
// ─────────────────────────────────────────────────────────────
window.closeModal = function() {
  document.getElementById("fOverlay").classList.remove("open");
};

function resetForm() {
  var frm = document.getElementById("instFrm"); if (frm) frm.reset();
  var el;
  el = document.getElementById("imgPrvs");  if (el) el.innerHTML = "";
  el = document.getElementById("exImgWrap"); if (el) el.innerHTML = "";
  el = document.getElementById("vPrv");      if (el) el.style.display = "none";
  el = document.getElementById("progWrap"); if (el) el.style.display = "none";
}

// ─────────────────────────────────────────────────────────────
//  SAVE INSTITUTION  (Cloudinary upload + Firestore write)
// ─────────────────────────────────────────────────────────────
window.saveInst = async function() {
  var name = getVal("fName"), type = getVal("fType");
  if (!name || !type) { toast("Name and type are required", "err"); return; }

  var sb = document.getElementById("saveBtn");
  sb.disabled = true;
  sb.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving\u2026';

  var pw = document.getElementById("progWrap");
  var pf = document.getElementById("pFill");
  var pl = document.getElementById("pLbl");

  try {
    // ── Upload new images to Cloudinary ──────────────────────
    var newImgURLs = [];
    if (selImgs.length) {
      if (pw) pw.style.display = "block";
      for (var i = 0; i < selImgs.length; i++) {
        if (pl) pl.textContent = "Uploading image " + (i+1) + " of " + selImgs.length + "\u2026";
        var imgUrl = await uploadImage(selImgs[i], function(pct) {
          if (pf) pf.style.width = pct + "%";
        });
        newImgURLs.push(imgUrl);
        if (pf) pf.style.width = "0%";
      }
    }

    // ── Upload new video to Cloudinary (only if new file selected) ──
    var videoUrl = "";
    // In edit mode, preserve the existing saved video URL
    if (fMode === "edit" && fDocId) {
      var existSnap = await getDoc(doc(db, "institutions", fDocId));
      var existData = existSnap.data();
      videoUrl = (existData && existData.videoUrl) ? existData.videoUrl : "";
    }
    if (selVid) {
      if (pw) pw.style.display = "block";
      if (pl) pl.textContent = "Uploading video\u2026";
      videoUrl = await uploadVideo(selVid, function(pct) {
        if (pf) pf.style.width = pct + "%";
      });
    }
    if (pw) pw.style.display = "none";

    // ── Merge images: kept existing + newly uploaded ──────────
    var allImages = existImgs.concat(newImgURLs);

    // ── Firestore payload ─────────────────────────────────────
    var data = {
      name:        getVal("fName"),
      type:        getVal("fType"),
      location:    getVal("fLocation"),
      code:        getVal("fCode") || genCode(),
      rating:      parseFloat(getVal("fRating")) || 4.5,
      estYear:     getVal("fEstYear"),
      description: getVal("fDesc"),
      facilities:  getVal("fFacilities"),
      fees:        getVal("fFees"),
      contact:     getVal("fContact"),
      reviewCount: getVal("fRevCount"),
      featured:    !!(document.getElementById("fFeatured") && document.getElementById("fFeatured").checked),
      images:      allImages,
      videoUrl:    videoUrl,
      courses:     parseCourses(getVal("fCourses")),
    };

    if (fMode === "add") {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, "institutions"), data);
      toast("Institution added successfully!", "ok");
    } else {
      data.updatedAt = serverTimestamp();
      await updateDoc(doc(db, "institutions", fDocId), data);
      toast("Institution updated successfully!", "ok");
    }

    window.closeModal();
    showDash(data.type);
    var vHome = document.getElementById("vHome");
    if (vHome && vHome.classList.contains("on")) loadHomeFeatured();

  } catch(e) {
    toast("Save failed: " + e.message, "err");
    console.error("saveInst error:", e);
  } finally {
    sb.disabled  = false;
    sb.innerHTML = '<i class="fas fa-save"></i> Save';
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE INSTITUTION
// ─────────────────────────────────────────────────────────────
window.delInst = async function(id, type) {
  if (!confirm("Delete this institution? This cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, "institutions", id));
    toast("Institution deleted", "ok");
    showDash(type);
  } catch(e) { toast("Delete failed: " + e.message, "err"); }
};

// ─────────────────────────────────────────────────────────────
//  PARSE COURSES TEXT  (each line = name or JSON object)
// ─────────────────────────────────────────────────────────────
function parseCourses(raw) {
  if (!raw || !raw.trim()) return [];
  return raw.split("\n").map(function(line) {
    line = line.trim();
    if (!line) return null;
    try { return JSON.parse(line); }
    catch(_) { return {name:line, duration:"", fees:"", eligibility:"", seats:""}; }
  }).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
function getVal(id) {
  var el = document.getElementById(id);
  if (!el) return "";
  return el.type === "checkbox" ? el.checked : (el.value || "");
}
function setVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}
function cap(s)     { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function genCode()  { return "MENT" + Math.floor(100 + Math.random() * 900); }

// ─────────────────────────────────────────────────────────────
//  COUNTER ANIMATION
// ─────────────────────────────────────────────────────────────
function animCounters() {
  document.querySelectorAll(".stat-n[data-t]").forEach(function(el) {
    var target = parseInt(el.dataset.t);
    var count  = 0;
    var step   = target / (1800 / 16);
    var timer  = setInterval(function() {
      count = Math.min(count + step, target);
      el.textContent = target >= 1000
        ? Math.floor(count).toLocaleString() + "+"
        : Math.floor(count) + (target > 5 ? "+" : "");
      if (count >= target) clearInterval(timer);
    }, 16);
  });
}

var statsSec = document.querySelector(".stats-sec");
if (statsSec) {
  new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) animCounters(); });
  }, {threshold: 0.3}).observe(statsSec);
}
