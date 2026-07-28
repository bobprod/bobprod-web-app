(function () {
  // ---------- login / logout ----------
  var loginScreen = document.getElementById('login-screen');
  var shell = document.getElementById('wf-shell');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var avatarBtn = document.getElementById('avatar-btn');
  var avatarDropdown = document.getElementById('avatar-dropdown');
  var logoutBtn = document.getElementById('logout-btn');

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var password = document.getElementById('login-password').value;
    if (password === 'wrong') {
      loginError.hidden = false;
      return;
    }
    loginError.hidden = true;
    loginScreen.hidden = true;
    shell.hidden = false;
    shell.classList.remove('wf-fading-in');
    void shell.offsetWidth;
    shell.classList.add('wf-fading-in');
  });

  avatarBtn.addEventListener('click', function () {
    var open = avatarDropdown.hidden;
    avatarDropdown.hidden = !open;
    avatarBtn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', function (e) {
    if (!avatarDropdown.hidden && !avatarBtn.contains(e.target) && !avatarDropdown.contains(e.target)) {
      avatarDropdown.hidden = true;
      avatarBtn.setAttribute('aria-expanded', 'false');
    }
  });

  logoutBtn.addEventListener('click', function () {
    avatarDropdown.hidden = true;
    shell.hidden = true;
    loginScreen.hidden = false;
    loginError.hidden = true;
    document.getElementById('login-password').value = '••••••••';
  });

  // ---------- shared drag-to-reorder helper ----------
  // Native HTML5 drag-and-drop, dragging the whole row (simplest reliable
  // approach for a prototype — a handle-only drag would need extra
  // mousedown/up wiring to toggle `draggable` on the row).
  // dataArrOrGetter: the array to reorder, or a function returning it (use a
  // getter when the underlying array can change, e.g. switching tabs).
  function makeSortable(containerEl, dataArrOrGetter, rerender) {
    var dragIndex = null;
    function getArr() {
      return typeof dataArrOrGetter === 'function' ? dataArrOrGetter() : dataArrOrGetter;
    }
    containerEl.addEventListener('dragstart', function (e) {
      var row = e.target.closest('[data-index]');
      if (!row) return;
      dragIndex = Number(row.dataset.index);
      row.classList.add('wf-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    containerEl.addEventListener('dragend', function (e) {
      var row = e.target.closest('[data-index]');
      if (row) row.classList.remove('wf-dragging');
    });
    containerEl.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    containerEl.addEventListener('drop', function (e) {
      e.preventDefault();
      var row = e.target.closest('[data-index]');
      if (!row || dragIndex === null) return;
      var dropIndex = Number(row.dataset.index);
      if (dropIndex === dragIndex) return;
      var arr = getArr();
      var item = arr.splice(dragIndex, 1)[0];
      arr.splice(dropIndex, 0, item);
      dragIndex = null;
      rerender();
    });
  }

  // ---------- demo data-state (empty / loading / error) ----------
  // Lets the wireframe show what each list-driven screen looks like before
  // data exists, while it's loading, or when the request fails — not just
  // the happy path with rows already filled in.
  var demoState = 'loaded';
  var dataRenderers = [];

  function stateBlock(opts) {
    if (demoState === 'empty') return '<div class="wf-empty-state">' + opts.empty + '</div>';
    if (demoState === 'loading') {
      var rows = '';
      for (var i = 0; i < (opts.skeletonRows || 3); i++) rows += '<div class="wf-skeleton-row"></div>';
      return '<div class="wf-loading-state">' + rows + '</div>';
    }
    if (demoState === 'error') {
      return '<div class="wf-error-state">' +
        '<span>' + (opts.error || 'Failed to load — check your connection and try again.') + '</span>' +
        '<button type="button" class="wf-btn wf-btn-ghost wf-btn-sm wf-retry">Retry</button>' +
        '</div>';
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('wf-retry')) {
      document.getElementById('data-state-select').value = 'loaded';
      demoState = 'loaded';
      dataRenderers.forEach(function (fn) { fn(); });
    }
  });

  var dataStateSelect = document.getElementById('data-state-select');
  if (dataStateSelect) {
    dataStateSelect.addEventListener('change', function () {
      demoState = dataStateSelect.value;
      dataRenderers.forEach(function (fn) { fn(); });
    });
  }

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
    n.addEventListener('click', function () {
      showPage(n.dataset.page);
      closeSidebar();
    });
  });

  // ---------- responsive: off-canvas sidebar ----------
  var sidebar = document.querySelector('.wf-sidebar');
  var hamburgerBtn = document.getElementById('hamburger-btn');
  var sidebarBackdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    sidebar.classList.add('open');
    sidebarBackdrop.hidden = false;
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarBackdrop.hidden = true;
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  hamburgerBtn.addEventListener('click', function () {
    if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
  });
  sidebarBackdrop.addEventListener('click', closeSidebar);

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
      row.draggable = true;
      row.dataset.index = i;
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

  if (navEditor) {
    renderNavEditor();
    makeSortable(navEditor, navItems, renderNavEditor);
  }

  // ---------- tracks ----------
  var tracksData = [
    { title: 'Night Signal (Original Mix)', artist: 'bobprod', duration: '3:42' },
    { title: 'Afterglow (Extended Mix)', artist: 'bobprod', duration: '5:18' },
    { title: 'Concrete Heat', artist: 'bobprod', duration: '4:07' },
    { title: 'Warehouse 12 — Full Set', artist: 'bobprod', duration: '1:18:32' },
  ];

  var tracksTbody = document.getElementById('tracks-tbody');

  function renderTracks() {
    tracksTbody.innerHTML = '';
    var demo = stateBlock({ empty: 'No tracks yet — click "+ Add track" to upload one.', error: 'Could not load tracks.', skeletonRows: 4 });
    if (demo) { tracksTbody.innerHTML = '<tr><td colspan="5">' + demo + '</td></tr>'; return; }
    if (!tracksData.length) {
      tracksTbody.innerHTML = '<tr><td colspan="5"><div class="wf-empty-state">No tracks yet — click "+ Add track" to upload one.</div></td></tr>';
      return;
    }
    tracksData.forEach(function (track, i) {
      var row = document.createElement('tr');
      row.draggable = true;
      row.dataset.index = i;
      row.innerHTML =
        '<td class="wf-drag">⠿</td>' +
        '<td>' + track.title + '</td>' +
        '<td>' + track.artist + '</td>' +
        '<td>' + track.duration + '</td>' +
        '<td class="wf-row-actions"><button class="wf-icon-btn" title="Edit">✎</button><button class="wf-icon-btn" title="Delete">✕</button></td>';
      row.querySelector('[title="Delete"]').addEventListener('click', function () {
        tracksData.splice(i, 1);
        renderTracks();
      });
      tracksTbody.appendChild(row);
    });
  }

  if (tracksTbody) {
    renderTracks();
    makeSortable(tracksTbody, tracksData, renderTracks);
    dataRenderers.push(renderTracks);
  }

  // ---------- links ----------
  var linksData = [
    { platform: 'Spotify', color: '#1ED760', title: 'Listen on Spotify', sub: 'Night Signal — Original Mix', enabled: true },
    { platform: 'Apple Music', color: 'linear-gradient(135deg,#FA233B,#FB5C74)', title: 'Listen on Apple Music', sub: 'Night Signal — Original Mix', enabled: true },
    { platform: 'Deezer', color: '#00C7F2', title: 'Listen on Deezer', sub: 'Night Signal — Original Mix', enabled: true },
    { platform: 'Beatport', color: '#01FF95', title: 'Buy on Beatport', sub: 'DJ-ready WAV / AIFF', enabled: true },
    { platform: 'SoundCloud', color: '#FF7700', title: 'Follow on SoundCloud', sub: 'soundcloud.com/bobby-prod', enabled: true },
    { platform: 'YouTube', color: '#FF0000', title: 'Subscribe on YouTube', sub: 'Music videos & sets', enabled: false },
    { platform: 'Instagram', color: 'linear-gradient(135deg,#feda75,#d62976,#4f5bd5)', title: 'Follow on Instagram', sub: '@bobprod', enabled: true },
    { platform: 'Custom', color: 'linear-gradient(135deg,#d1382a,#f0a91f)', title: 'Get Tour Tickets', sub: 'Berlin · Lyon · Amsterdam', enabled: true },
  ];

  var linkList = document.getElementById('link-list');

  function renderLinks() {
    linkList.innerHTML = '';
    var demo = stateBlock({ empty: 'No links yet — click "+ Add link" to start building your /links page.', error: 'Could not load links.' });
    if (demo) { linkList.innerHTML = demo; return; }
    if (!linksData.length) {
      linkList.innerHTML = '<div class="wf-empty-state">No links yet — click "+ Add link" to start building your /links page.</div>';
      return;
    }
    linksData.forEach(function (link, i) {
      var row = document.createElement('div');
      row.className = 'wf-link-row' + (link.enabled ? '' : ' disabled');
      row.draggable = true;
      row.dataset.index = i;
      row.innerHTML =
        '<span class="wf-drag">⠿</span>' +
        '<span class="wf-platform-dot" style="background:' + link.color + '"></span>' +
        '<span class="wf-link-text"><b>' + link.title + '</b><small>' + link.sub + '</small></span>' +
        '<label class="wf-switch"><input type="checkbox" ' + (link.enabled ? 'checked' : '') + '><span></span></label>' +
        '<button class="wf-icon-btn" title="Edit">✎</button>';
      row.querySelector('input[type="checkbox"]').addEventListener('change', function (e) {
        link.enabled = e.target.checked;
        row.classList.toggle('disabled', !link.enabled);
      });
      linkList.appendChild(row);
    });
  }

  if (linkList) {
    renderLinks();
    makeSortable(linkList, linksData, renderLinks);
    dataRenderers.push(renderLinks);
  }

  // ---------- events ----------
  var eventsData = [
    { day: 'Aug 14', venue: 'Tresor Club', city: 'Berlin, Germany', published: true },
    { day: 'Sep 02', venue: 'Le Sucre', city: 'Lyon, France', published: true },
    { day: 'Sep 21', venue: 'De School', city: 'Amsterdam, NL', published: false },
  ];

  var eventsTbody = document.getElementById('events-tbody');

  function renderEvents() {
    eventsTbody.innerHTML = '';
    var demo = stateBlock({ empty: 'No events yet — click "+ Add event" to schedule one.', error: 'Could not load events.' });
    if (demo) { eventsTbody.innerHTML = '<tr><td colspan="5">' + demo + '</td></tr>'; return; }
    if (!eventsData.length) {
      eventsTbody.innerHTML = '<tr><td colspan="5"><div class="wf-empty-state">No events yet — click "+ Add event" to schedule one.</div></td></tr>';
      return;
    }
    eventsData.forEach(function (ev, i) {
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + ev.day + '</td><td>' + ev.venue + '</td><td>' + ev.city + '</td>' +
        '<td>' + (ev.published ? '<span class="wf-pill wf-pill-confirmed">Yes</span>' : '<span class="wf-pill wf-pill-neutral">Draft</span>') + '</td>' +
        '<td class="wf-row-actions"><button class="wf-icon-btn" title="Edit">✎</button><button class="wf-icon-btn" title="Delete">✕</button></td>';
      row.querySelector('[title="Delete"]').addEventListener('click', function () {
        eventsData.splice(i, 1);
        renderEvents();
      });
      eventsTbody.appendChild(row);
    });
  }

  if (eventsTbody) {
    renderEvents();
    dataRenderers.push(renderEvents);
  }

  // ---------- bookings ----------
  var bookingsData = [
    { name: 'Amine Bouarada', email: 'amine@example.com', type: 'Festival', date: 'Jul 15, 2026', message: 'Looking for a 90-minute closing set for our...', status: 'pending' },
    { name: 'Lena Fischer', email: 'lena.fischer@mail.com', type: 'Private Event', date: 'Aug 02, 2026', message: 'Birthday party, ~150 guests, warehouse space...', status: 'confirmed' },
    { name: 'Marco Dubois', email: 'marco.d@clubnine.fr', type: 'Club Night', date: 'Sep 09, 2026', message: 'Resident night, 3-hour set, Friday...', status: 'pending' },
  ];

  var bookingsTbody = document.getElementById('bookings-tbody');

  function renderBookings() {
    bookingsTbody.innerHTML = '';
    var demo = stateBlock({ empty: 'No booking requests yet.', error: 'Could not load bookings.' });
    if (demo) { bookingsTbody.innerHTML = '<tr><td colspan="6">' + demo + '</td></tr>'; return; }
    if (!bookingsData.length) {
      bookingsTbody.innerHTML = '<tr><td colspan="6"><div class="wf-empty-state">No booking requests yet.</div></td></tr>';
      return;
    }
    bookingsData.forEach(function (booking) {
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + booking.name + '</td><td>' + booking.email + '</td><td>' + booking.type + '</td><td>' + booking.date + '</td>' +
        '<td class="wf-truncate">' + booking.message + '</td>' +
        '<td><select class="wf-status-select ' + booking.status + '">' +
        '<option value="pending"' + (booking.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
        '<option value="confirmed"' + (booking.status === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
        '<option value="declined"' + (booking.status === 'declined' ? ' selected' : '') + '>Declined</option>' +
        '</select></td>';
      var select = row.querySelector('.wf-status-select');
      select.addEventListener('change', function () {
        booking.status = select.value;
        select.classList.remove('pending', 'confirmed', 'declined');
        select.classList.add(select.value);
      });
      bookingsTbody.appendChild(row);
    });
  }

  if (bookingsTbody) {
    renderBookings();
    dataRenderers.push(renderBookings);
  }

  // ---------- assistant: LLM providers ----------
  var providersData = [
    { label: 'OpenRouter (multi-model)', type: 'openrouter', model: 'deepseek/deepseek-chat', key: 'sk-••••4f2a', active: true, isDefault: true },
    { label: 'Anthropic direct', type: 'anthropic', model: 'claude-sonnet-5', key: 'sk-ant-••••9c1', active: true, isDefault: false },
  ];

  var providerList = document.getElementById('provider-list');

  function renderProviders() {
    providerList.innerHTML = '';
    var demo = stateBlock({ empty: 'No LLM provider configured yet — the chat widget stays hidden until one is added and set as default.', error: 'Could not load providers.' });
    if (demo) { providerList.innerHTML = '<tr><td colspan="7">' + demo + '</td></tr>'; return; }
    if (!providersData.length) {
      providerList.innerHTML = '<tr><td colspan="7"><div class="wf-empty-state">No LLM provider configured yet — the chat widget stays hidden until one is added and set as default.</div></td></tr>';
      return;
    }
    providersData.forEach(function (p, i) {
      var row = document.createElement('tr');
      row.innerHTML =
        '<td><input type="radio" name="default-provider" ' + (p.isDefault ? 'checked' : '') + '></td>' +
        '<td>' + p.label + '</td>' +
        '<td><span class="wf-badge-type">' + p.type + '</span></td>' +
        '<td><code>' + p.model + '</code></td>' +
        '<td><code>' + p.key + '</code></td>' +
        '<td><label class="wf-switch"><input type="checkbox" ' + (p.active ? 'checked' : '') + '><span></span></label></td>' +
        '<td class="wf-row-actions"><button class="wf-btn wf-btn-ghost wf-btn-sm">Test</button><button class="wf-icon-btn" title="Delete">✕</button></td>';
      row.querySelector('input[type="radio"]').addEventListener('change', function () {
        providersData.forEach(function (other) { other.isDefault = false; });
        p.isDefault = true;
      });
      row.querySelector('[title="Delete"]').addEventListener('click', function () {
        providersData.splice(i, 1);
        if (p.isDefault && providersData.length) providersData[0].isDefault = true;
        renderProviders();
      });
      providerList.appendChild(row);
    });
  }

  if (providerList) {
    renderProviders();
    dataRenderers.push(renderProviders);
  }

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
      blockList.innerHTML = '<div class="wf-empty-state">No blocks on this page yet — click "+ Add block" to start.</div>';
      return;
    }
    items.forEach(function (block, i) {
      var row = document.createElement('div');
      row.className = 'wf-block-row' + (block.enabled ? '' : ' disabled');
      row.draggable = true;
      row.dataset.index = i;
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

  if (blockList) {
    renderBlockList();
    makeSortable(blockList, function () { return blocksByPage[currentBlockPage]; }, renderBlockList);
  }

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
