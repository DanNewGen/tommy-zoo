(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* копирование контактов */
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-copy");
      function done() { var t = b.textContent; b.textContent = "Скопировано"; setTimeout(function () { b.textContent = t; }, 1500); }
      try { navigator.clipboard.writeText(v).then(done, function () {}); } catch (e) {}
    });
  });

  /* поиск с подсказками по всему каталогу */
  var input = $("#q"), list = $("#suggest");
  var INDEX = window.SEARCH_INDEX || [];
  if (input && list) {
    function show(items, q) {
      list.textContent = "";
      if (!items.length) {
        var li = document.createElement("li"); li.className = "none"; li.textContent = "Ничего не нашли по запросу «" + q + "»"; list.appendChild(li);
      } else items.forEach(function (p) {
        var li = document.createElement("li"), a = document.createElement("a"), s = document.createElement("small");
        a.href = p.url; a.textContent = (p.brand ? p.brand + " " : "") + p.name; s.textContent = p.note; a.appendChild(s); li.appendChild(a); list.appendChild(li);
      });
      list.hidden = false;
    }
    function find(q) {
      q = q.toLowerCase();
      return INDEX.filter(function (p) { return (p.brand + " " + p.name + " " + p.note).toLowerCase().indexOf(q) !== -1; });
    }
    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (q.length < 2) { list.hidden = true; return; }
      show(find(q).slice(0, 6), q);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { var r = find(input.value.trim()); if (r.length) location.href = r[0].url; e.preventDefault(); }
      if (e.key === "Escape") list.hidden = true;
    });
    document.addEventListener("click", function (e) { if (!e.target.closest(".search")) list.hidden = true; });
  }

  /* фильтры на страницах каталога */
  var grid = $("#grid");
  if (grid) {
    var cards = $$(".card", grid);
    var state = { sub: "all", brands: {}, q: "", sort: "az" };
    var subBox = $("#f-subs"), brandBox = $("#f-brands");

    function uniq(attr) {
      var m = {}, order = [];
      cards.forEach(function (c) {
        var v = c.getAttribute("data-" + attr); if (!v) return;
        var key = attr === "sub" ? c.getAttribute("data-subslug") : v;
        if (!m[key]) { m[key] = { key: key, title: v, n: 0 }; order.push(key); }
        m[key].n++;
      });
      return order.map(function (k) { return m[k]; });
    }

    var subs = uniq("sub");
    if (subBox) {
      var all = document.createElement("li");
      function btn(key, title, n) {
        var li = document.createElement("li"), b = document.createElement("button");
        b.type = "button"; b.className = "fbtn"; b.setAttribute("data-key", key); b.setAttribute("aria-pressed", key === "all" ? "true" : "false");
        b.appendChild(document.createTextNode(title)); var s = document.createElement("small"); s.textContent = n; b.appendChild(s);
        b.addEventListener("click", function () { state.sub = key; sync(); apply(); });
        li.appendChild(b); return li;
      }
      subBox.appendChild(btn("all", "Все", cards.length));
      subs.forEach(function (s) { subBox.appendChild(btn(s.key, s.title, s.n)); });
    }
    function sync() { $$(".fbtn", subBox).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-key") === state.sub ? "true" : "false"); }); }

    var brands = uniq("brand");
    if (brandBox) {
      if (!brands.length) { brandBox.closest(".fgroup").hidden = true; }
      brands.forEach(function (br) {
        var li = document.createElement("li"), l = document.createElement("label"), c = document.createElement("input");
        c.type = "checkbox"; c.addEventListener("change", function () { state.brands[br.key] = c.checked; apply(); });
        l.appendChild(c); l.appendChild(document.createTextNode(br.title)); li.appendChild(l); brandBox.appendChild(li);
      });
    }

    var fq = $("#f-q"); if (fq) fq.addEventListener("input", function () { state.q = fq.value.trim().toLowerCase(); apply(); });
    var sort = $("#sort"); if (sort) sort.addEventListener("change", function () { state.sort = sort.value; apply(); });

    function plural(n) {
      var a = n % 10, b = n % 100;
      if (a === 1 && b !== 11) return "товар";
      if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "товара";
      return "товаров";
    }
    function apply() {
      var anyBrand = Object.keys(state.brands).some(function (k) { return state.brands[k]; });
      var shown = 0;
      var sorted = cards.slice().sort(function (a, b) {
        var x = a.getAttribute("data-name"), y = b.getAttribute("data-name");
        return state.sort === "za" ? y.localeCompare(x, "ru") : x.localeCompare(y, "ru");
      });
      sorted.forEach(function (c) { grid.appendChild(c); });
      cards.forEach(function (c) {
        var ok = (state.sub === "all" || c.getAttribute("data-subslug") === state.sub) &&
          (!anyBrand || state.brands[c.getAttribute("data-brand")]) &&
          (!state.q || c.getAttribute("data-name").indexOf(state.q) !== -1);
        c.hidden = !ok; if (ok) shown++;
      });
      $("#count").textContent = shown + " " + plural(shown);
      $("#empty").hidden = shown > 0;
    }

    var h = (location.hash || "").replace("#", "");
    if (h && subs.some(function (s) { return s.key === h; })) { state.sub = h; sync(); }
    apply();
  }
})();
