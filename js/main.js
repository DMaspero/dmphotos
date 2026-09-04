(function () {
  "use strict";

  var PHOTO_LIST = typeof PHOTOS !== "undefined" ? PHOTOS : [];
  var CAT_LIST = typeof CATEGORIES !== "undefined" ? CATEGORIES : [];

  var gridEl = document.getElementById("grid");
  var emptyNote = document.getElementById("emptyNote");
  var tagCloudEl = document.getElementById("tagCloud");
  var catNavEl = document.getElementById("catNav");
  var galleryTitleEl = document.getElementById("galleryTitle");
  var backBtnEl = document.getElementById("backBtn");

  var lightboxEl = document.getElementById("lightbox");
  var lbImg = lightboxEl.querySelector(".lb-img");
  var lbMeta = lightboxEl.querySelector(".lb-meta");
  var lbTags = lightboxEl.querySelector("#lbTags");
  var lbStage = lightboxEl.querySelector(".lb-stage");
  var lbZoomBtn = lightboxEl.querySelector(".lb-zoom");

  var state = { view: "index", category: "all", tags: {} }; // view: "index" | "grid"
  var filteredList = [];
  var lbIndex = 0;
  var lbToken = 0;
  var pendingRemove = {}; // data-file -> timeout id

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FADE = reducedMotion ? 0 : 460;

  /* ---------------- firebase likes ---------------- */

  var likesRef = null;
  var likeCounts = {};  // filename -> count
  var likedByUser = {}; // filename -> true (localStorage)
  var likeCooldown = {}; // filename -> timestamp of last click

  (function initFirebase() {
    try {
      if (typeof firebase === "undefined") return;
      likesRef = firebase.database().ref("likes");

      // Load user's liked photos from localStorage
      try {
        var saved = JSON.parse(localStorage.getItem("liked") || "{}");
        if (typeof saved === "object" && saved !== null) likedByUser = saved;
      } catch (e) {}

      // Listen for all like counts in real time
      likesRef.on("value", function (snap) {
        var data = snap.val() || {};
        likeCounts = {};
        Object.keys(data).forEach(function (k) { likeCounts[decodeKey(k)] = data[k] || 0; });
        updateAllLikeButtons();
      });
    } catch (e) {}
  })();

  function encodeKey(s) {
    return s.replace(/\./g, "_dot_");
  }

  function decodeKey(s) {
    return s.replace(/_dot_/g, ".");
  }

  function toggleLike(filename, btn) {
    var now = Date.now();
    if (likeCooldown[filename] && now - likeCooldown[filename] < 1000) return;
    likeCooldown[filename] = now;

    var wasLiked = !!likedByUser[filename];
    likedByUser[filename] = !wasLiked;
    try { localStorage.setItem("liked", JSON.stringify(likedByUser)); } catch (e) {}

    // Update Firebase (increment/decrement)
    if (likesRef) {
      likesRef.child(encodeKey(filename)).transaction(function (cur) {
        return (cur || 0) + (wasLiked ? -1 : 1);
      }).catch(function (err) {
        console.warn("Like sync failed:", err);
      });
    }

    // Update button state immediately (visual feedback)
    btn.classList.toggle("is-liked", !wasLiked);
  }

  function makeLikeBtn(filename) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "like-btn" + (likedByUser[filename] ? " is-liked" : "");
    btn.dataset.likeFile = filename;
    btn.innerHTML =
      '<svg class="like-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h2V9H2v11zm20-11a2 2 0 0 0-2-2h-6.32l.95-4.57.03-.32a1.5 1.5 0 0 0-.44-1.06L13.17 0 7.59 5.59A2 2 0 0 0 7 7v10a2 2 0 0 0 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>' +
      '<span class="like-count">' + (likeCounts[filename] || 0) + '</span>';
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleLike(filename, btn);
    });
    return btn;
  }

  function updateAllLikeButtons() {
    document.querySelectorAll("[data-like-file]").forEach(function (btn) {
      var f = btn.dataset.likeFile;
      btn.classList.toggle("is-liked", !!likedByUser[f]);
      var countEl = btn.querySelector(".like-count");
      if (countEl) countEl.textContent = likeCounts[f] || 0;
    });
  }

  /* ---------------- filtering ---------------- */

  function matches(p) {
    if (state.category !== "all" && p.category !== state.category) return false;
    var tags = Object.keys(state.tags);
    if (tags.length === 0) return true;
    var list = Array.isArray(p.tags) ? p.tags : [];
    return tags.every(function (t) { return list.indexOf(t) !== -1; });
  }

  function currentFiltered() {
    return PHOTO_LIST.filter(matches);
  }

  /* ---------------- tag cloud ---------------- */

  function buildTagCloud() {
    var source = state.view === "index" ? PHOTO_LIST : currentFiltered();
    var counts = {};
    source.forEach(function (p) {
      (Array.isArray(p.tags) ? p.tags : []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; });
    });
    var tags = Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    });

    tagCloudEl.textContent = "";
    tags.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tag-chip" + (state.tags[t] ? " is-active" : "");
      b.textContent = t;
      b.dataset.tag = t;
      b.addEventListener("click", function () { toggleTag(t); });
      tagCloudEl.appendChild(b);
    });
    if (tags.length === 0) tagCloudEl.classList.add("is-empty");
    else tagCloudEl.classList.remove("is-empty");
  }

  function toggleTag(t) {
    if (state.tags[t]) delete state.tags[t];
    else state.tags[t] = true;
    if (state.view === "index") {
      state.category = "all";
      state.view = "grid";
      updateGalleryHead();
      refreshCatNav();
      swapTo(render);
    } else {
      render();
    }
  }

  /* ---------------- tiles ---------------- */

  function createTile(p) {
    var a = document.createElement("a");
    a.className = "tile";
    a.href = "#";
    a.dataset.file = p.file;
    a.style.setProperty("--span", String(spanFor(p)));

    var picture = document.createElement("picture");
    if (p.srcWebp) {
      var source = document.createElement("source");
      source.srcset = p.srcWebp;
      source.type = "image/webp";
      picture.appendChild(source);
    }
    var img = document.createElement("img");
    img.src = p.thumb;
    img.alt = p.file;
    img.loading = "lazy";
    img.decoding = "async";
    picture.appendChild(img);

    a.appendChild(picture);

    a.appendChild(makeLikeBtn(p.file));

    a.appendChild(makeLikeBtn(p.file));

    img.addEventListener("load", function () {
      picture.classList.add("is-loaded");
    });
    if (img.complete) picture.classList.add("is-loaded");

    a.addEventListener("click", function (e) {
      if (e.target.closest(".like-btn")) return;
      e.preventDefault();
      openLightboxAt(p.file);
    });
    return a;
  }

  function gridMetrics() {
    var cs = getComputedStyle(gridEl);
    var cols = 1;
    var colW = gridEl.clientWidth || 300;
    var tpl = cs.gridTemplateColumns;
    if (tpl && tpl !== "none") {
      var parts = tpl.split(" ");
      cols = parts.length;
      var first = parseFloat(parts[0]);
      if (first > 0) colW = first;
    }
    return {
      gap: parseFloat(cs.columnGap) || 18,
      rowGap: parseFloat(cs.rowGap) || 10,
      rowH: parseFloat(cs.gridAutoRows) || 10,
      colW: colW,
    };
  }

  function spanFor(p) {
    var m = gridMetrics();
    var imgH = m.colW * (p.h / p.w);
    return Math.max(2, Math.ceil((imgH + m.rowGap) / (m.rowH + m.rowGap)));
  }

  function updateSpans() {
    PHOTO_LIST.forEach(function (p) {
      var tile = gridEl.querySelector('.tile[data-file="' + cssEscape(p.file) + '"]');
      if (tile) tile.style.setProperty("--span", String(spanFor(p)));
    });
  }

  window.addEventListener("resize", debounce(function () { updateSpans(); }, 150));

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  function render() {
    gridEl.classList.toggle("is-index", state.view === "index");
    if (state.view === "index") { renderIndex(); return; }
    renderGrid();
  }

  function renderGrid() {
    filteredList = currentFiltered();
    var visible = {};
    filteredList.forEach(function (p) { visible[p.file] = true; });

    // Animate out tiles that no longer match.
    Array.prototype.forEach.call(gridEl.querySelectorAll(".tile"), function (tile) {
      var file = tile.dataset.file;
      if (visible[file]) {
        if (tile.classList.contains("leaving")) {
          clearTimeout(pendingRemove[file]);
          delete pendingRemove[file];
          tile.classList.remove("leaving");
        }
      } else if (!tile.classList.contains("leaving")) {
        tile.classList.add("leaving");
        pendingRemove[file] = setTimeout(function () {
          if (tile.parentNode === gridEl) gridEl.removeChild(tile);
          delete pendingRemove[file];
        }, FADE);
      }
    });

    // Create tiles for newly visible photos, staggered.
    var stagger = 0;
    filteredList.forEach(function (p) {
      var existing = gridEl.querySelector('.tile[data-file="' + cssEscape(p.file) + '"]');
      if (existing) return;
      var tile = createTile(p);
      tile.classList.add("enter");
      gridEl.appendChild(tile);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          tile.style.transitionDelay = (reducedMotion ? 0 : Math.min(stagger, 14) * 40) + "ms";
          tile.classList.remove("enter");
        });
      });
      stagger++;
      setTimeout(function () { tile.style.transitionDelay = ""; }, FADE + stagger * 40 + 60);
    });

    emptyNote.hidden = filteredList.length > 0;
    buildTagCloud();
  }

  /* ---------------- index view ----------------
   * Category card view. Only rendered when state.view === "index". */

  function renderIndex() {
    gridEl.textContent = "";
    CAT_LIST.forEach(function (name) {
      var photos = PHOTO_LIST.filter(function (p) { return p.category === name; });
      if (photos.length === 0) return;

      var card = document.createElement("button");
      card.type = "button";
      card.className = "cat-card";
      card.dataset.cat = name;
      card.addEventListener("click", function () { enterCategory(name); });

      var sorted = photos.slice().sort(function (a, b) {
        var la = likeCounts[a.file] || 0;
        var lb = likeCounts[b.file] || 0;
        if (lb !== la) return lb - la;
        return b.file.localeCompare(a.file);
      });

      var prev = document.createElement("div");
      prev.className = "cc-prev";
      sorted.slice(0, 3).forEach(function (p) {
        var picture = document.createElement("picture");
        if (p.thumbWebp) {
          var source = document.createElement("source");
          source.srcset = p.thumbWebp;
          source.type = "image/webp";
          picture.appendChild(source);
        }
        var img = document.createElement("img");
        img.className = "cc-img";
        img.src = p.thumb;
        img.alt = p.file;
        img.loading = "lazy";
        picture.appendChild(img);
        prev.appendChild(picture);
      });

      var label = document.createElement("div");
      label.className = "cc-label";
      var nm = document.createElement("span");
      nm.className = "cc-name";
      nm.textContent = cap(name);
      var cnt = document.createElement("span");
      cnt.className = "cc-count";
      cnt.textContent = photos.length + " photo" + (photos.length !== 1 ? "s" : "");
      label.appendChild(nm);
      label.appendChild(cnt);

      card.appendChild(prev);
      card.appendChild(label);
      gridEl.appendChild(card);
    });
    emptyNote.hidden = true;
    buildTagCloud();
  }

  /* ---------------- view switching ---------------- */

  function updateGalleryHead() {
    backBtnEl.hidden = state.view === "index";
    catNavEl.hidden = state.view === "index";
    galleryTitleEl.textContent = state.view === "index"
      ? "Gallery"
      : (state.category === "all" ? "All photos" : cap(state.category));
  }

  // Fade the grid out, swap content (clears tiles/cards), fade back in.
  function swapTo(fn) {
    if (reducedMotion) { gridEl.textContent = ""; fn(); return; }
    gridEl.classList.add("fade-swap");
    setTimeout(function () {
      gridEl.textContent = "";
      fn();
      gridEl.classList.remove("fade-swap");
    }, 240);
  }

  function enterCategory(name) {
    var fromIndex = state.view === "index";
    state.category = name;
    state.view = "grid";
    updateGalleryHead();
    refreshCatNav();
    if (fromIndex) swapTo(render);
    else render();
  }

  function goIndex() {
    state.view = "index";
    state.category = "all";
    state.tags = {};
    updateGalleryHead();
    swapTo(render);
  }

  function cssEscape(s) {
    return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  /* ---------------- category nav ---------------- */

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function buildCatNav() {
    catNavEl.textContent = "";
    ["all"].concat(CAT_LIST).forEach(function (name) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "cat-btn";
      b.dataset.cat = name;
      b.textContent = name === "all" ? "All" : cap(name);
      b.addEventListener("click", function () {
        state.category = name;
        state.tags = {};
        state.view = "grid";
        refreshCatNav();
        updateGalleryHead();
        render();
      });
      catNavEl.appendChild(b);
    });
    refreshCatNav();
  }

  function refreshCatNav() {
    Array.prototype.forEach.call(catNavEl.querySelectorAll(".cat-btn"), function (b) {
      b.classList.toggle("is-active", b.dataset.cat === state.category);
    });
  }

  /* ---------------- lightbox ---------------- */

  var lbClose = lightboxEl.querySelector(".lb-close");
  var lbPrev = lightboxEl.querySelector(".lb-prev");
  var lbNext = lightboxEl.querySelector(".lb-next");

  function openLightboxAt(file) {
    lbIndex = filteredList.findIndex(function (p) { return p.file === file; });
    if (lbIndex === -1) lbIndex = 0;
    showLb();
    lightboxEl.classList.add("is-open");
    lightboxEl.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
    showHints();
  }

  var lbHintsEl = document.getElementById("lbHints");
  var hintsTimer = 0;
  function showHints() {
    if (!lbHintsEl) return;
    clearTimeout(hintsTimer);
    lbHintsEl.classList.add("is-visible");
    hintsTimer = setTimeout(function () {
      lbHintsEl.classList.remove("is-visible");
    }, 3000);
  }

  function showLb() {
    var p = filteredList[lbIndex];
    if (!p) return;
    var token = ++lbToken;
    lbImg.classList.remove("is-shown");
    lbImg.style.opacity = "0";
    lbMeta.textContent = p.category ? p.category : "";
    renderLbTags(p);

    // Lightbox EXIF
    var lbExif = document.getElementById("lbExif");
    if (lbExif) {
      lbExif.textContent = "";
      if (p.exif) {
        var left = [];
        var right = [];
        if (p.exif.camera) left.push(p.exif.camera);
        if (p.exif.lens) left.push(p.exif.lens);
        if (p.exif.focal) right.push(p.exif.focal);
        if (p.exif.aperture) right.push(p.exif.aperture);
        if (p.exif.shutter) right.push(p.exif.shutter);
        if (p.exif.iso) right.push(p.exif.iso);

        left.forEach(function (part, i) {
          if (i > 0) {
            var sep = document.createElement("span");
            sep.textContent = "|";
            lbExif.appendChild(sep);
          }
          var s = document.createElement("span");
          s.textContent = part;
          lbExif.appendChild(s);
        });
        if (left.length && right.length) {
          var sep = document.createElement("span");
          sep.textContent = "|";
          lbExif.appendChild(sep);
        }
        right.forEach(function (part, i) {
          if (i > 0) {
            var dash = document.createElement("span");
            dash.textContent = "-";
            lbExif.appendChild(dash);
          }
          var s = document.createElement("span");
          s.textContent = part;
          lbExif.appendChild(s);
        });
      }
    }

    // Lightbox like button
    var likeWrap = document.getElementById("lbLikeWrap");
    if (likeWrap) {
      likeWrap.textContent = "";
      likeWrap.appendChild(makeLikeBtn(p.file));
    }

    setTimeout(function () {
      if (token !== lbToken) return;
      lbImg.src = p.srcWebp || p.src;
      lbImg.alt = p.file;
    }, 60);
    setTimeout(function () {
      if (token !== lbToken) return;
      lbImg.classList.add("is-shown");
      lbImg.style.opacity = "";
      resetZoom();
    }, 90);
    lbIndex = (lbIndex + filteredList.length) % filteredList.length;
  }

  function renderLbTags(p) {
    lbTags.textContent = "";
    (Array.isArray(p.tags) ? p.tags : []).forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tag-chip" + (state.tags[t] ? " is-active" : "");
      b.textContent = t;
      b.addEventListener("click", function () {
        toggleTag(t);
        closeLb();
      });
      lbTags.appendChild(b);
    });
  }

  function closeLb() {
    lightboxEl.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(function () {
      if (!lightboxEl.classList.contains("is-open")) lightboxEl.hidden = true;
    }, 320);
  }

  lbClose.addEventListener("click", closeLb);
  lbPrev.addEventListener("click", function () { lbIndex = (lbIndex - 1 + filteredList.length) % filteredList.length; showLb(); });
  lbNext.addEventListener("click", function () { lbIndex = (lbIndex + 1) % filteredList.length; showLb(); });

  lightboxEl.addEventListener("click", function (e) {
    if (e.target === lightboxEl || e.target.classList.contains("lb-backdrop")) closeLb();
  });

  document.addEventListener("keydown", function (e) {
    if (lightboxEl.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") { lbIndex = (lbIndex - 1 + filteredList.length) % filteredList.length; showLb(); }
    else if (e.key === "ArrowRight") { lbIndex = (lbIndex + 1) % filteredList.length; showLb(); }
    else if (e.key === "+" || e.key === "=") zoomBy(1.4);
    else if (e.key === "-" || e.key === "_") zoomBy(0.8);
    else if (e.key === "0") resetZoom();
  });

  /* ---------------- zoom & pan ---------------- */

  var ZOOM_MAX = 4;
  var lbZoom = 1;
  var pan = { x: 0, y: 0 };
  var dragging = false;
  var dragStart = null;

  function clampZoom(z) {
    return Math.min(ZOOM_MAX, Math.max(1, z));
  }

  // Keep the world point under (cx, cy) fixed while scaling to z.
  function zoomTo(z, cx, cy) {
    var r = lbStage.getBoundingClientRect();
    var imgW = lbImg.offsetWidth;
    var imgH = lbImg.offsetHeight;
    if (!imgW || !imgH) return;
    var offX = (r.width - imgW) / 2;
    var offY = (r.height - imgH) / 2;

    var wx = (cx - offX - pan.x) / lbZoom;
    var wy = (cy - offY - pan.y) / lbZoom;

    lbZoom = clampZoom(z);
    pan.x = cx - offX - wx * lbZoom;
    pan.y = cy - offY - wy * lbZoom;
    applyZoomTransform(true);
  }

  function zoomBy(factor) {
    var r = lbStage.getBoundingClientRect();
    zoomTo(lbZoom * factor, r.width / 2, r.height / 2);
  }

  function applyZoomTransform(animate) {
    if (animate) lbImg.classList.remove("is-dragging");
    lbImg.style.transformOrigin = "0 0";
    lbImg.style.transform = "translate(" + pan.x + "px, " + pan.y + "px) scale(" + lbZoom + ")";
    lbImg.classList.toggle("is-zoomed", lbZoom > 1);
    lbZoomBtn.classList.toggle("is-zoomed", lbZoom > 1);
    lbZoomBtn.setAttribute("aria-label", lbZoom > 1 ? "Zoom out" : "Zoom in");
    lbZoomBtn.textContent = lbZoom > 1 ? "\u2212" : "+";
  }

  function zoomAtPoint(e) {
    var r = lbStage.getBoundingClientRect();
    zoomTo(lbZoom > 1 ? 1 : 2.5, e.clientX - r.left, e.clientY - r.top);
  }

  function resetZoom() {
    lbZoom = 1;
    pan.x = 0;
    pan.y = 0;
    applyZoomTransform(true);
  }

  lbZoomBtn.addEventListener("click", function () { zoomBy(lbZoom > 1 ? 1 / lbZoom : 2); });

  lbImg.addEventListener("dblclick", function (e) {
    e.preventDefault();
    zoomAtPoint(e);
  });

  lbImg.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 || lbZoom <= 1) return;
    e.preventDefault();
    dragging = false;
    dragStart = { id: e.pointerId, x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    lbImg.setPointerCapture(e.pointerId);
    lbImg.classList.add("is-dragging");
  });

  lbImg.addEventListener("pointermove", function (e) {
    if (!dragStart || e.pointerId !== dragStart.id) return;
    var dx = e.clientX - dragStart.x;
    var dy = e.clientY - dragStart.y;
    if (!dragging && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    dragging = true;
    pan.x = dragStart.px + dx;
    pan.y = dragStart.py + dy;
    applyZoomTransform(false);
  });

  function endDrag(e) {
    if (!dragStart || e.pointerId !== dragStart.id) return;
    lbImg.classList.remove("is-dragging");
    dragStart = null;
    dragging = false;
  }

  lbImg.addEventListener("pointerup", endDrag);
  lbImg.addEventListener("pointercancel", endDrag);

  lbStage.addEventListener("wheel", function (e) {
    e.preventDefault();
    var r = lbStage.getBoundingClientRect();
    zoomTo(lbZoom * (e.deltaY < 0 ? 1.3 : 1 / 1.3), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });

  /* ---------------- init ---------------- */

  document.addEventListener("contextmenu", function (e) {
    if (e.target.closest("img, picture, .tile, .hero-feat")) e.preventDefault();
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  // Populate site content from SITE global
  var site = typeof SITE !== "undefined" ? SITE : {};
  if (site.title) {
    document.title = site.title;
    var navTitle = document.getElementById("siteNavTitle");
    if (navTitle) navTitle.textContent = site.title;
  }
  if (site.kicker) {
    var el = document.getElementById("siteTitle");
    if (el) el.textContent = site.kicker;
  }
  if (site.footer) {
    var el = document.getElementById("siteFooter");
    if (el) el.textContent = site.footer;
  }
  if (site.description) {
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", site.description);
  }

  backBtnEl.addEventListener("click", goIndex);
  buildCatNav();
  buildTagCloud();
  updateGalleryHead();
  render();

  /* ---------------- service worker ---------------- */

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }

  /* ---------------- featured carousel in hero ---------------- */

  (function renderHeroFeatured() {
    var el = document.getElementById("heroFeatured");
    if (!el) return;
    var featured = PHOTO_LIST.filter(function (p) { return p.featured; });
    if (featured.length === 0) return;

    // Build marquee: duplicate list for seamless loop
    var wrap = document.createElement("div");
    wrap.className = "hero-marq";
    var track = document.createElement("div");
    track.className = "hero-marq-track";

    // For very few items, repeat enough times to fill viewport and avoid visible gap.
    // We duplicate at least 2x; for 1-2 items duplicate 4x.
    var copies = featured.length <= 2 ? 4 : 2;
    var seq = [];
    for (var c = 0; c < copies; c++) seq = seq.concat(featured);

    seq.forEach(function (p) {
      var div = document.createElement("div");
      div.className = "hero-feat";
      // Prefer web image for larger display, fallback to thumb
      var picture = document.createElement("picture");
      if (p.srcWebp) {
        var s = document.createElement("source");
        s.srcset = p.srcWebp;
        s.type = "image/webp";
        picture.appendChild(s);
      }
      var img = document.createElement("img");
      img.src = p.src || p.thumb;
      img.alt = p.file;
      img.loading = "lazy";
      img.decoding = "async";
      picture.appendChild(img);
      div.appendChild(picture);
      div.addEventListener("click", function () {
        filteredList = featured.slice();
        openLightboxAt(p.file);
      });
      track.appendChild(div);
    });

    // Slow marquee: ~8s per featured item, min 30s. Pauses on hover, disabled for reduced-motion.
    var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReduced) {
      var duration = Math.max(30, featured.length * 8); // e.g. 4 items -> 32s
      track.style.animationDuration = duration + "s";
    } else {
      track.style.animation = "none";
      // Fallback: make it horizontally scrollable
      wrap.style.overflowX = "auto";
      wrap.style.scrollbarWidth = "none";
    }

    wrap.appendChild(track);
    el.appendChild(wrap);
  })();

  /* ---------------- dark mode ---------------- */

  (function initTheme() {
    var toggle = document.getElementById("themeToggle");
    if (!toggle) return;
    var saved = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (saved === "dark" || (!saved && prefersDark)) {
      document.documentElement.classList.add("dark");
    }
    toggle.addEventListener("click", function () {
      document.documentElement.classList.toggle("dark");
      localStorage.setItem("theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
  })();

  /* ---------------- hamburger ---------------- */

  (function initHamburger() {
    var btn = document.getElementById("hamburger");
    var nav = document.getElementById("siteNav");
    if (!btn || !nav) return;
    function closeNav() {
      nav.classList.remove("is-open");
      btn.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      btn.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && e.target !== btn) {
        closeNav();
      }
    });
  })();

  /* ---------------- scroll to top ---------------- */

  (function initScrollTop() {
    var btn = document.getElementById("scrollTop");
    if (!btn) return;
    window.addEventListener("scroll", debounce(function () {
      btn.classList.toggle("is-visible", window.scrollY > 400);
    }, 100));
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  })();
})();
