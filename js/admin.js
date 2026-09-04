(function () {
  "use strict";

  var TOKEN_KEY = "photo_admin_token";

  var el = {
    login: document.getElementById("login"),
    loginForm: document.getElementById("loginForm"),
    tokenInput: document.getElementById("tokenInput"),
    panels: document.getElementById("panels"),
    status: document.getElementById("status"),
    saveBtn: document.getElementById("saveBtn"),
    syncMetaBtn: document.getElementById("syncMetaBtn"),
    // Site content
    siteTitle: document.getElementById("siteTitle"),
    siteKicker: document.getElementById("siteKicker"),
    siteFooter: document.getElementById("siteFooter"),
    siteDesc: document.getElementById("siteDesc"),
    saveSiteBtn: document.getElementById("saveSiteBtn"),
    // Build
    buildWm: document.getElementById("buildWm"),
    buildWmSize: document.getElementById("buildWmSize"),
    buildWmPos: document.getElementById("buildWmPos"),
    buildWmOpacity: document.getElementById("buildWmOpacity"),
    buildWmColor: document.getElementById("buildWmColor"),
    buildForce: document.getElementById("buildForce"),
    buildNoWm: document.getElementById("buildNoWm"),
    buildBtn: document.getElementById("buildBtn"),
    buildLog: document.getElementById("buildLog"),
    // Upload
    drop: document.getElementById("drop"),
    fileInput: document.getElementById("fileInput"),
    // Categories
    catList: document.getElementById("catList"),
    newCat: document.getElementById("newCat"),
    addCatBtn: document.getElementById("addCatBtn"),
    // Photos
    search: document.getElementById("search"),
    catChips: document.getElementById("catChips"),
    cards: document.getElementById("cards"),
    photoCount: document.getElementById("photoCount"),
    // Publish
    pushMessage: document.getElementById("pushMessage"),
    pushBtn: document.getElementById("pushBtn"),
    publishLog: document.getElementById("publishLog"),
  };

  var el2 = {
    photosDirInput: document.getElementById("photosDirInput"),
    savePhotosDirBtn: document.getElementById("savePhotosDirBtn"),
    resetPhotosDirBtn: document.getElementById("resetPhotosDirBtn"),
    photosDirCurrent: document.getElementById("photosDirCurrent"),
    uploadDirHint: document.getElementById("uploadDirHint"),
  };

  var photos = [];
  var cats = [];
  var catFilter = "all";
  var dirty = {};
  var bulkChanged = false;
  var pendingBuildCount = 0;

  /* ---------------- api ---------------- */

  function token() {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ "X-Admin-Token": token() }, opts.headers || {});
    return fetch(path, Object.assign({}, opts, { headers: headers })).then(function (res) {
      if (res.status === 401) { lock(); throw new Error("unauthorized"); }
      return res.json().catch(function () { return {}; });
    }).then(function (data) {
      if (data && data.error) throw new Error(data.error);
      return data;
    });
  }

  function status(msg, ok) {
    el.status.textContent = msg || "";
    el.status.className = "status" + (ok ? " ok" : "");
  }

  function statusErr(msg) {
    el.status.textContent = msg || "";
    el.status.className = "status err";
  }

  function lock() {
    sessionStorage.removeItem(TOKEN_KEY);
    el.login.hidden = false;
    el.panels.hidden = true;
    status("Enter the admin token.");
  }

  /* ---------------- data ---------------- */

  function loadPhotosDir() {
    return api("/admin/photos-dir").then(function (data) {
      if (el2.photosDirInput) el2.photosDirInput.value = data.path || "photos";
      if (el2.photosDirCurrent) el2.photosDirCurrent.textContent = "Current: " + data.absolute + (data.exists ? "" : " (will be created)");
      if (el2.uploadDirHint) el2.uploadDirHint.textContent = "Uploading to: " + data.absolute;
    }).catch(function(){});
  }

  function savePhotosDir() {
    var raw = (el2.photosDirInput.value || "").trim();
    status("Saving photos folder…");
    el2.savePhotosDirBtn.disabled = true;
    api("/admin/photos-dir", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({path: raw}) })
      .then(function (data) {
        status("Photos folder saved: " + (data.path || "photos"), true);
        return loadPhotosDir();
      }).catch(function (e) { statusErr(e.message); })
      .finally(function(){ el2.savePhotosDirBtn.disabled = false; });
  }

  function resetPhotosDir() {
    if (el2.photosDirInput) el2.photosDirInput.value = "";
    savePhotosDir();
  }

  function load() {
    return Promise.all([
      api("/admin/data"),
      api("/admin/site"),
      loadPhotosDir(),
    ]).then(function (results) {
      var data = results[0];
      var siteData = results[1];

      photos = data.photos.map(function (p) {
        return {
          file: p.file,
          category: p.category || "",
          tags: Array.isArray(p.tags) ? p.tags.slice() : [],
          featured: !!p.featured,
        };
      });
      cats = (data.categories && data.categories.values) || [];

      // Populate site content
      el.siteTitle.value = siteData.title || "";
      el.siteKicker.value = siteData.kicker || "";
      el.siteFooter.value = siteData.footer || "";
      el.siteDesc.value = siteData.description || "";

      renderCatManager();
      renderChips();
      renderCards();
      updateWmPreview();
      el.login.hidden = true;
      el.panels.hidden = false;
      dirty = {};
      bulkChanged = false;
      setSaveState();
      status("Loaded " + photos.length + " photos.", true);
    }).catch(function (e) {
      statusErr(e.message);
    });
  }

  function computeCounts() {
    var c = {};
    photos.forEach(function (p) {
      if (p.category) c[p.category] = (c[p.category] || 0) + 1;
    });
    return c;
  }

  /* ---------------- cards ---------------- */

  function visible() {
    var q = (el.search.value || "").trim().toLowerCase();
    return (catFilter === "all" ? photos : photos.filter(function (p) { return p.category === catFilter; }))
      .filter(function (p) {
        if (!q) return true;
        return p.file.toLowerCase().indexOf(q) !== -1;
      });
  }

  function renderChips() {
    var total = photos.length;
    var counts = computeCounts();
    var chips = [["all", "All " + total]].
      concat(cats.map(function (c) { return [c, c + " " + (counts[c] || 0)]; }));
    el.catChips.textContent = "";
    chips.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (catFilter === pair[0] ? " is-active" : "");
      b.textContent = pair[1];
      b.addEventListener("click", function () {
        catFilter = pair[0];
        renderChips();
        renderCards();
      });
      el.catChips.appendChild(b);
    });
  }

  function renderCards() {
    el.cards.textContent = "";
    var list = visible();
    el.photoCount.textContent = "(" + list.length + ")";
    if (!list.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No photos match.";
      el.cards.appendChild(empty);
    }
    list.forEach(function (p) {
      el.cards.appendChild(buildCard(p));
    });
  }

  function buildCard(p) {
    var card = document.createElement("article");
    card.className = "card" + (dirty[p.file] ? " dirty" : "");
    card.dataset.file = p.file;

    var thumb = document.createElement("div");
    thumb.className = "thumb";
    var img = document.createElement("img");
    img.src = "images/thumbs/" + encodeURIComponent(p.file);
    img.alt = "";
    thumb.appendChild(img);

    var fields = document.createElement("div");
    fields.className = "fields";

    var file = document.createElement("div");
    file.className = "file";
    file.textContent = p.file;

    var cat = document.createElement("select");
    var none = document.createElement("option");
    none.value = "";
    none.textContent = "— no category —";
    cat.appendChild(none);
    cats.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      cat.appendChild(o);
    });
    cat.value = p.category;
    cat.addEventListener("change", function () {
      var ph = findPhoto(p.file);
      ph.category = cat.value;
      markDirty(p.file, card);
    });

    var tags = document.createElement("input");
    tags.type = "text";
    tags.value = (p.tags || []).join(", ");
    tags.placeholder = "tags, comma-separated";
    tags.addEventListener("input", function () {
      var ph = findPhoto(p.file);
      ph.tags = parseTags(tags.value);
      markDirty(p.file, card);
    });

    var hint = document.createElement("div");
    hint.className = "tags-hint";
    hint.textContent = "Tags: " + (p.tags || []).length;

    var feat = document.createElement("label");
    feat.className = "feat-row";
    var featCb = document.createElement("input");
    featCb.type = "checkbox";
    featCb.checked = !!p.featured;
    featCb.addEventListener("change", function () {
      findPhoto(p.file).featured = featCb.checked;
      markDirty(p.file, card);
    });
    feat.appendChild(featCb);
    feat.appendChild(document.createTextNode(" featured"));

    var delRow = document.createElement("div");
    delRow.className = "del-row";
    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "del-photo";
    delBtn.textContent = "Delete photo";
    delBtn.addEventListener("click", function () {
      deletePhoto(p.file);
    });
    delRow.appendChild(delBtn);

    fields.appendChild(file);
    fields.appendChild(cat);
    fields.appendChild(tags);
    fields.appendChild(hint);
    fields.appendChild(feat);
    fields.appendChild(delRow);

    card.appendChild(thumb);
    card.appendChild(fields);
    return card;
  }

  function findPhoto(file) {
    var out = photos.filter(function (p) { return p.file === file; });
    return out[0];
  }

  function parseTags(s) {
    var seen = [];
    String(s || "").split(",").forEach(function (t) {
      t = t.trim().toLowerCase();
      if (t && seen.indexOf(t) === -1) seen.push(t);
    });
    return seen;
  }

  function markDirty(file, card) {
    dirty[file] = true;
    if (card) card.classList.add("dirty");
    setSaveState();
  }

  function setSaveState() {
    el.saveBtn.disabled = !(bulkChanged || Object.keys(dirty).length > 0);
  }

  /* ---------------- category manager ---------------- */

  function renderCatManager() {
    var counts = computeCounts();
    el.catList.textContent = "";
    cats.forEach(function (name, idx) {
      var row = document.createElement("div");
      row.className = "cat-row";

      var input = document.createElement("input");
      input.type = "text";
      input.value = name;
      input.dataset.prev = name;
      input.addEventListener("change", function () {
        renameCategory(idx, input.value, input);
      });

      var count = document.createElement("span");
      count.className = "cat-count";
      count.textContent = (counts[name] || 0);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "del-cat";
      del.title = "Delete category";
      del.textContent = "\u00d7";
      del.addEventListener("click", function () {
        deleteCategory(name);
      });

      row.appendChild(input);
      row.appendChild(count);
      row.appendChild(del);
      el.catList.appendChild(row);
    });
  }

  function renameCategory(idx, raw, input) {
    var name = raw.trim();
    var prev = cats[idx];
    if (name === prev) { input.value = prev; return; }
    if (!name) { input.value = prev; statusErr("Category name cannot be empty."); return; }
    if (cats.indexOf(name) !== -1) { input.value = prev; statusErr('Category "' + name + '" already exists.'); return; }
    cats[idx] = name;
    photos.forEach(function (p) {
      if (p.category === prev) p.category = name;
    });
    bulkChanged = true;
    renderCatManager();
    renderChips();
    renderCards();
    setSaveState();
    status('Renamed "' + prev + '" to "' + name + '".', true);
  }

  function deleteCategory(name) {
    if (!confirm('Delete category "' + name + '"? Photos in it will become uncategorized.')) return;
    cats = cats.filter(function (c) { return c !== name; });
    photos.forEach(function (p) {
      if (p.category === name) p.category = "";
    });
    if (catFilter === name) catFilter = "all";
    bulkChanged = true;
    renderCatManager();
    renderChips();
    renderCards();
    setSaveState();
    status('Deleted category "' + name + '".', true);
  }

  function addCategory() {
    var name = (el.newCat.value || "").trim().toLowerCase();
    if (!name) return;
    if (cats.indexOf(name) !== -1) { statusErr('Category "' + name + '" already exists.'); return; }
    cats.push(name);
    el.newCat.value = "";
    bulkChanged = true;
    renderCatManager();
    renderChips();
    renderCards();
    setSaveState();
    status('Added category "' + name + '".', true);
  }

  /* ---------------- delete ---------------- */

  function deletePhoto(file) {
    if (!confirm('Delete "' + file + '"?\nThis removes the original photo and its generated images permanently.')) return;
    status("Deleting " + file + "…");
    api("/admin/delete?name=" + encodeURIComponent(file), { method: "POST" }).then(function (data) {
      status("Deleted and re-indexed (rc " + data.rc + ").", true);
      return load();
    }).catch(function (e) {
      statusErr("Delete failed: " + e.message);
    });
  }

  /* ---------------- save / rebuild ---------------- */

  function save() {
    status("Saving…");
    el.saveBtn.disabled = true;
    api("/admin/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: cats, photos: photos }),
    }).then(function (data) {
      status("Saved (re-index rc " + data.rc + ").", true);
      return load();
    }).catch(function (e) {
      statusErr("Save failed: " + e.message);
      setSaveState();
    });
  }

  function syncMeta() {
    status("Syncing metadata…");
    el.syncMetaBtn.disabled = true;
    api("/admin/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: cats, photos: photos }),
    }).then(function (data) {
      status("Metadata synced (rc " + data.rc + ").", true);
    }).catch(function (e) {
      statusErr("Sync failed: " + e.message);
    }).finally(function () {
      el.syncMetaBtn.disabled = false;
    });
  }

  /* ---------------- site content ---------------- */

  function saveSite() {
    status("Saving site content…");
    el.saveSiteBtn.disabled = true;
    api("/admin/site", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: el.siteTitle.value,
        kicker: el.siteKicker.value,
        footer: el.siteFooter.value,
        description: el.siteDesc.value,
      }),
    }).then(function () {
      status("Site content saved.", true);
    }).catch(function (e) {
      statusErr("Save failed: " + e.message);
    }).finally(function () {
      el.saveSiteBtn.disabled = false;
    });
  }

  /* ---------------- build ---------------- */

  function updateBuildBanner() {
    var banner = document.getElementById("buildPendingBanner");
    if (!banner) return;
    if (pendingBuildCount > 0) {
      banner.textContent = pendingBuildCount + " photo" + (pendingBuildCount !== 1 ? "s" : "") + " to build — click Build to generate thumbnails";
      banner.hidden = false;
    } else {
      banner.textContent = "";
      banner.hidden = true;
    }
  }

  function build() {
    status("Building…");
    el.buildBtn.disabled = true;
    el.buildLog.hidden = false;
    el.buildLog.textContent = "";
    var progWrap = document.getElementById("buildProgress");
    var progFill = document.getElementById("buildProgressFill");
    var progText = document.getElementById("buildProgressText");
    if (progWrap) { progWrap.hidden = false; }
    if (progFill) progFill.style.width = "0%";
    if (progText) progText.textContent = "0%";

    var args = {
      force: el.buildForce.checked,
      no_watermark: el.buildNoWm.checked,
      watermark: el.buildWm.value || undefined,
      watermark_size: parseFloat(el.buildWmSize.value) || undefined,
      watermark_pos: el.buildWmPos.value || undefined,
      watermark_opacity: parseInt(el.buildWmOpacity.value, 10) || undefined,
      watermark_color: el.buildWmColor.value || undefined,
    };

    fetch("/admin/build", {
      method: "POST",
      headers: { "X-Admin-Token": token(), "Content-Type": "application/json" },
      body: JSON.stringify(args),
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var j; try { j = JSON.parse(t); } catch(e) {}
          throw new Error((j && j.error) || t || ("HTTP " + res.status));
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      var rc = 0;
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) {
            if (progFill) progFill.style.width = "100%";
            if (progText) progText.textContent = "Done";
            setTimeout(function(){ if (progWrap) progWrap.hidden = true; }, 1200);
            status("Build complete (rc " + rc + ").", rc === 0);
            if (rc === 0) {
              pendingBuildCount = 0;
              updateBuildBanner();
            }
            return load();
          }
          buffer += decoder.decode(r.value, { stream: true });
          var lines = buffer.split("\n");
          buffer = lines.pop();
          lines.forEach(function (line) {
            if (!line) return;
            if (line.indexOf("__PROGRESS__") === 0) {
              var m = line.match(/__PROGRESS__\s+(\d+)\/(\d+)/);
              if (m && progFill && progText) {
                var cur = parseInt(m[1],10), tot = parseInt(m[2],10);
                var pct = tot ? Math.round(cur/tot*100) : 0;
                progFill.style.width = pct + "%";
                progText.textContent = cur + "/" + tot + " — " + pct + "%";
              }
              return;
            }
            if (line.indexOf("__BUILD_DONE__") === 0) {
              var mm = line.match(/rc=(\d+)/);
              if (mm) rc = parseInt(mm[1],10);
              return;
            }
            el.buildLog.textContent += line + "\n";
            el.buildLog.scrollTop = el.buildLog.scrollHeight;
          });
          return pump();
        });
      }
      return pump();
    }).catch(function (e) {
      statusErr("Build failed: " + e.message);
      el.buildLog.textContent += "\nERROR: " + e.message + "\n";
      if (progWrap) progWrap.hidden = true;
    }).finally(function () {
      el.buildBtn.disabled = false;
    });
  }

  /* ---------------- upload ---------------- */

  function uploadFiles(files) {
    var list = Array.prototype.slice.call(files);
    if (!list.length) return;
    status("Uploading " + list.length + " file(s)…");
    var chain = Promise.resolve();
    list.forEach(function (f) {
      chain = chain.then(function () {
        return api("/admin/upload?name=" + encodeURIComponent(f.name), { method: "POST", body: f });
      });
    });
    chain.then(function () {
      pendingBuildCount += list.length;
      updateBuildBanner();
      status("Uploaded " + list.length + " file(s) — " + pendingBuildCount + " to build.", true);
      // scroll to Build panel so banner is visible
      var bp = document.getElementById("buildPanel");
      if (bp) bp.scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function (e) {
      statusErr("Upload failed: " + e.message);
    });
  }

  /* ---------------- publish ---------------- */

  function push() {
    if (!confirm("Commit everything and push to GitHub?")) return;
    status("Pushing to GitHub…");
    el.pushBtn.disabled = true;
    el.publishLog.hidden = false;
    el.publishLog.textContent = "";
    fetch("/admin/push", {
      method: "POST",
      headers: { "X-Admin-Token": token(), "Content-Type": "application/json" },
      body: JSON.stringify({ message: el.pushMessage.value.trim() }),
    }).then(function (res) {
      return res.text().then(function (t) {
        var j; try { j = JSON.parse(t); } catch(e) {}
        if (!res.ok) throw new Error((j && (j.error || j.log)) || t || ("HTTP " + res.status));
        return j;
      });
    }).then(function (j) {
      el.publishLog.textContent = j.log || "";
      el.publishLog.scrollTop = el.publishLog.scrollHeight;
      status(j.committed ? ("Pushed " + (j.commit || "") + " — live at https://dmaspero.github.io/dmphotos/ in ~1 min.") : "Nothing new — already up to date.", true);
    }).catch(function (e) {
      statusErr("Push failed: " + e.message);
    }).finally(function(){
      el.pushBtn.disabled = false;
    });
  }

  /* ---------------- events ---------------- */

  el.loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    sessionStorage.setItem(TOKEN_KEY, el.tokenInput.value.trim());
    el.tokenInput.value = "";
    load();
  });
  el.saveBtn.addEventListener("click", save);
  el.syncMetaBtn.addEventListener("click", syncMeta);
  el.search.addEventListener("input", renderCards);
  el.addCatBtn.addEventListener("click", addCategory);
  el.newCat.addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addCategory(); }
  });

  // Site content
  el.saveSiteBtn.addEventListener("click", saveSite);

  // Build
  el.buildBtn.addEventListener("click", build);

  // Watermark preview
  var wmPreviewImg = document.getElementById("wmPreviewImg");
  var wmPreviewOverlay = document.getElementById("wmPreviewOverlay");
  var wmPreviewBox = document.getElementById("wmPreviewBox");
  var wmFields = ["buildWmSize", "buildWmPos", "buildWmOpacity", "buildWmColor", "buildNoWm"];

  var wmSvgText = null; // cached raw SVG text

  function updateWmPreview() {
    if (!wmPreviewImg || !wmPreviewOverlay) return;
    if (photos.length > 0) {
      var newSrc = "images/thumbs/" + encodeURIComponent(photos[0].file);
      if (wmPreviewImg.src !== newSrc) wmPreviewImg.src = newSrc;
    }
    var noWm = el.buildNoWm.checked;
    wmPreviewOverlay.style.display = noWm ? "none" : "block";
    if (noWm) return;

    var size = parseFloat(el.buildWmSize.value) || 0.08;
    var pos = el.buildWmPos.value || "bottom-center";
    var opacity = parseInt(el.buildWmOpacity.value, 10) || 200;
    var color = el.buildWmColor.value.trim();

    // Size
    wmPreviewOverlay.style.width = (size * 100) + "%";
    wmPreviewOverlay.style.height = "auto";
    wmPreviewOverlay.style.opacity = (opacity / 255).toFixed(2);

    // Color tint: recolor SVG by setting fill on all paths
    if (color && wmSvgText) {
      var tinted = wmSvgText;
      // Add or replace fill on <path> elements
      tinted = tinted.replace(/<path\b/g, '<path fill="' + color + '"');
      // Also set fill on <g> and root <svg> to propagate
      tinted = tinted.replace(/<svg\b([^>]*)>/, '<svg$1 fill="' + color + '">');
      // Remove any existing fill-color CSS that might override
      tinted = tinted.replace(/fill\s*:\s*[^;"']+;?/gi, "fill:" + color + ";");
      var blob = new Blob([tinted], { type: "image/svg+xml" });
      wmPreviewOverlay.src = URL.createObjectURL(blob);
    } else if (!color && wmSvgText) {
      wmPreviewOverlay.src = "images/assets/watermark.svg";
    }

    // Position
    var positions = {
      "top-left":     { top: "8%", left: "8%", right: "auto", bottom: "auto", transform: "none" },
      "top-center":   { top: "8%", left: "50%", right: "auto", bottom: "auto", transform: "translateX(-50%)" },
      "top-right":    { top: "8%", right: "8%", left: "auto", bottom: "auto", transform: "none" },
      "center-left":  { top: "50%", left: "8%", right: "auto", bottom: "auto", transform: "translateY(-50%)" },
      "center":       { top: "50%", left: "50%", right: "auto", bottom: "auto", transform: "translate(-50%, -50%)" },
      "center-right": { top: "50%", right: "8%", left: "auto", bottom: "auto", transform: "translateY(-50%)" },
      "bottom-left":  { bottom: "8%", left: "8%", top: "auto", right: "auto", transform: "none" },
      "bottom-center":{ bottom: "8%", left: "50%", top: "auto", right: "auto", transform: "translateX(-50%)" },
      "bottom-right": { bottom: "8%", right: "8%", top: "auto", left: "auto", transform: "none" },
    };
    var p = positions[pos] || positions["bottom-center"];
    Object.keys(p).forEach(function (k) { wmPreviewOverlay.style[k] = p[k]; });
  }

  wmFields.forEach(function (id) {
    var field = el[id];
    if (field) field.addEventListener("input", updateWmPreview);
    if (field) field.addEventListener("change", updateWmPreview);
  });
  // Fetch SVG for color tinting
  fetch("images/assets/watermark.svg").then(function (r) { return r.text(); }).then(function (txt) {
    wmSvgText = txt;
    updateWmPreview();
  });
  updateWmPreview();

  // Upload
  el.drop.addEventListener("dragover", function (e) {
    e.preventDefault();
    el.drop.classList.add("dragover");
  });
  el.drop.addEventListener("dragleave", function () {
    el.drop.classList.remove("dragover");
  });
  el.drop.addEventListener("drop", function (e) {
    e.preventDefault();
    el.drop.classList.remove("dragover");
    uploadFiles(e.dataTransfer.files);
  });
  el.fileInput.addEventListener("change", function () {
    uploadFiles(el.fileInput.files);
    el.fileInput.value = "";
  });

  // Photos folder
  if (el2.savePhotosDirBtn) el2.savePhotosDirBtn.addEventListener("click", savePhotosDir);
  if (el2.resetPhotosDirBtn) el2.resetPhotosDirBtn.addEventListener("click", resetPhotosDir);

  // Publish
  el.pushBtn.addEventListener("click", push);

  /* Load immediately. If the server requires a token (ADMIN_TOKEN set), a 401
     will show the login form instead. */
  load();
})();
