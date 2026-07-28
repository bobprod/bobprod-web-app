(function () {
  var pageTitles = {
    dashboard: 'Dashboard', tracks: 'Tracks', events: 'Events', bookings: 'Bookings',
    links: 'Links', branding: 'Branding', blocks: 'Content Blocks', assistant: 'Assistant',
    marketing: 'Marketing', settings: 'SEO & General',
  };

  var pages = document.querySelectorAll('.wf-page');
  var navlinks = document.querySelectorAll('.wf-navlink');
  var titleEl = document.getElementById('page-title');

  function showPage(name) {
    pages.forEach(function (p) { p.hidden = p.dataset.page !== name; p.classList.toggle('active', p.dataset.page === name); });
    navlinks.forEach(function (n) { n.classList.toggle('active', n.dataset.page === name); });
    titleEl.textContent = pageTitles[name] || name;
  }

  navlinks.forEach(function (n) {
    n.addEventListener('click', function () { showPage(n.dataset.page); });
  });

  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function () { showPage(el.dataset.goto); });
  });

  // ---------- inline form / panel toggles ----------
  document.querySelectorAll('[data-toggle]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = document.getElementById(el.dataset.toggle);
      if (target) target.hidden = !target.hidden;
    });
  });

  // ---------- booking status select coloring ----------
  document.querySelectorAll('.wf-status-select').forEach(function (sel) {
    sel.addEventListener('change', function () {
      sel.classList.remove('pending', 'confirmed', 'declined');
      sel.classList.add(sel.value);
    });
  });

  // ---------- branding: color pickers ----------
  [['clr-red', 'clr-red-hex'], ['clr-gold', 'clr-gold-hex'], ['clr-bg', 'clr-bg-hex']].forEach(function (pair) {
    var picker = document.getElementById(pair[0]);
    var hexInput = document.getElementById(pair[1]);
    if (!picker || !hexInput) return;
    picker.addEventListener('input', function () {
      hexInput.value = picker.value;
      updateThemePreview();
    });
    hexInput.addEventListener('change', function () {
      if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
        picker.value = hexInput.value;
        updateThemePreview();
      }
    });
  });

  function updateThemePreview() {
    var preview = document.getElementById('theme-preview');
    if (!preview) return;
    var red = document.getElementById('clr-red-hex').value;
    var gold = document.getElementById('clr-gold-hex').value;
    preview.style.background = 'linear-gradient(135deg, ' + red + ', ' + gold + ')';
  }

  // ---------- branding: nav bar editor ----------
  var navItems = [
    { label: 'Home', route: '/', visible: true },
    { label: 'Music', route: '/music', visible: true },
    { label: 'Bio', route: '/bio', visible: true },
    { label: 'Events', route: '/events', visible: true },
    { label: 'Contact', route: '/contact', visible: true },
    { label: 'Links', route: '/links', visible: false },
  ];

  var navEditor = document.getElementById('nav-editor');

  function renderNavEditor() {
    navEditor.innerHTML = '';
    navItems.forEach(function (item, i) {
      var row = document.createElement('div');
      row.className = 'wf-nav-editor-row';
      row.innerHTML =
        '<span class="wf-drag">⠿</span>' +
        '<label class="wf-switch"><input type="checkbox" ' + (item.visible ? 'checked' : '') + '><span></span></label>' +
        '<input type="text" value="' + item.label + '">' +
        '<code>' + item.route + '</code>' +
        '<div class="wf-reorder-btns"><button data-dir="up" ' + (i === 0 ? 'disabled' : '') + '>▲</button><button data-dir="down" ' + (i === navItems.length - 1 ? 'disabled' : '') + '>▼</button></div>';

      row.querySelector('input[type="checkbox"]').addEventListener('change', function (e) {
        navItems[i].visible = e.target.checked;
      });
      row.querySelector('input[type="text"]').addEventListener('input', function (e) {
        navItems[i].label = e.target.value;
      });
      row.querySelectorAll('.wf-reorder-btns button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var dir = btn.dataset.dir === 'up' ? -1 : 1;
          var j = i + dir;
          if (j < 0 || j >= navItems.length) return;
          var tmp = navItems[i];
          navItems[i] = navItems[j];
          navItems[j] = tmp;
          renderNavEditor();
        });
      });

      navEditor.appendChild(row);
    });
  }

  if (navEditor) renderNavEditor();

  // ---------- content blocks ----------
  var blockCatalogNames = {
    newsletter_signup: 'Newsletter Signup', merch_grid: 'Merch Grid', testimonials: 'Testimonials',
    press_quotes: 'Press Quotes', upcoming_shows: 'Upcoming Shows', custom_html: 'Custom HTML',
  };

  var blocksByPage = {
    home: [
      { type: 'upcoming_shows', enabled: true },
      { type: 'newsletter_signup', enabled: false },
    ],
    bio: [
      { type: 'testimonials', enabled: true },
      { type: 'press_quotes', enabled: false },
    ],
    music: [], events: [], contact: [], links: [],
  };

  var currentBlockPage = 'home';
  var blockList = document.getElementById('block-list');
  var blockTabs = document.querySelectorAll('.wf-tab');

  function renderBlockList() {
    var items = blocksByPage[currentBlockPage] || [];
    blockList.innerHTML = '';
    if (!items.length) {
      blockList.innerHTML = '<div class="wf-block-empty">No blocks on this page yet — click "+ Add block" to start.</div>';
      return;
    }
    items.forEach(function (block, i) {
      var row = document.createElement('div');
      row.className = 'wf-block-row' + (block.enabled ? '' : ' disabled');
      row.innerHTML =
        '<span class="wf-drag">⠿</span>' +
        '<b>' + blockCatalogNames[block.type] + '</b>' +
        '<label class="wf-switch"><input type="checkbox" ' + (block.enabled ? 'checked' : '') + '><span></span></label>' +
        '<button type="button" class="wf-btn wf-btn-ghost wf-btn-sm">Configure</button>' +
        '<button type="button" class="wf-icon-btn" title="Delete">✕</button>';

      row.querySelector('input[type="checkbox"]').addEventListener('change', function (e) {
        block.enabled = e.target.checked;
        row.classList.toggle('disabled', !block.enabled);
      });
      row.querySelector('.wf-icon-btn').addEventListener('click', function () {
        items.splice(i, 1);
        renderBlockList();
      });

      blockList.appendChild(row);
    });
  }

  blockTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      blockTabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentBlockPage = tab.dataset.blockPage;
      renderBlockList();
    });
  });

  document.querySelectorAll('.wf-catalog-card').forEach(function (card) {
    card.addEventListener('click', function () {
      blocksByPage[currentBlockPage].push({ type: card.dataset.block, enabled: false });
      document.getElementById('block-catalog').hidden = true;
      renderBlockList();
    });
  });

  if (blockList) renderBlockList();

  // ---------- assistant: default provider radio ----------
  // native radio inputs already enforce single-select; nothing extra needed.

  // ---------- marketing: AI SEO draft demo ----------
  var seoBtn = document.getElementById('seo-generate-btn');
  var seoDraft = document.getElementById('seo-draft');
  var seoDrafts = {
    '/': ['bobprod — house & techno DJ / producer', 'New EP "Night Signal" out now. Tour dates across Europe this fall.'],
    '/music': ['Music — Night Signal EP & DJ sets | bobprod', 'Stream the new single and long-form DJ mixes from bobprod.'],
    '/bio': ['About bobprod — house & techno producer', 'Warehouse sets that fuse driving low-end with melodic hooks. Based in Berlin.'],
    '/events': ['Tour Dates — bobprod live', 'Upcoming club nights and festival sets across Europe.'],
    '/contact': ['Book bobprod', 'Club nights, private events & festivals — get in touch.'],
    '/links': ['bobprod — all links', 'Music, socials and tickets in one place.'],
  };

  if (seoBtn) {
    seoBtn.addEventListener('click', function () {
      var route = document.getElementById('seo-route').value;
      seoBtn.textContent = 'Generating…';
      seoBtn.disabled = true;
      setTimeout(function () {
        var draft = seoDrafts[route] || seoDrafts['/'];
        document.getElementById('seo-title').value = draft[0];
        document.getElementById('seo-desc').value = draft[1];
        seoDraft.hidden = false;
        seoBtn.textContent = 'Generate draft';
        seoBtn.disabled = false;
      }, 500);
    });
  }
})();
