(function () {
  var state = {
    type: 'Club Night',
    monthOffset: 0,
    selectedDay: null,
    name: '',
    email: '',
  };

  var form = document.getElementById('booking-form');
  var successScreen = document.getElementById('success-screen');
  var typeChips = document.getElementById('type-chips');
  var monthLabel = document.getElementById('month-label');
  var dayGrid = document.getElementById('day-grid');
  var submitBtn = document.getElementById('submit-btn');
  var nameInput = document.getElementById('booking-name');
  var emailInput = document.getElementById('booking-email');
  var successTitle = document.getElementById('success-title');
  var successMeta = document.getElementById('success-meta');

  function computeCalendar() {
    var base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + state.monthOffset);
    var year = base.getFullYear(), month = base.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var label = base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var cells = [];
    for (var i = 0; i < firstDay; i++) cells.push(null);
    for (var d = 1; d <= daysInMonth; d++) cells.push(d);
    return { label, cells };
  }

  function renderCalendar() {
    var cal = computeCalendar();
    monthLabel.textContent = cal.label;
    dayGrid.innerHTML = '';
    cal.cells.forEach(function (d) {
      var wrap = document.createElement('div');
      wrap.className = 'day-cell-wrap';
      if (d) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'daycell' + (d === state.selectedDay ? ' selected' : '');
        btn.textContent = d;
        btn.addEventListener('click', function () {
          state.selectedDay = d;
          renderCalendar();
          renderSubmit();
        });
        wrap.appendChild(btn);
      }
      dayGrid.appendChild(wrap);
    });
  }

  function renderSubmit() {
    submitBtn.disabled = !state.selectedDay;
  }

  typeChips.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.type = chip.dataset.type;
      typeChips.querySelectorAll('.chip').forEach(function (c) {
        var active = c === chip;
        c.classList.toggle('active', active);
        c.setAttribute('aria-checked', String(active));
      });
    });
  });

  document.getElementById('prev-month').addEventListener('click', function () {
    state.monthOffset = Math.max(0, state.monthOffset - 1);
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', function () {
    state.monthOffset += 1;
    renderCalendar();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!state.selectedDay) return;
    state.name = nameInput.value.trim();
    state.email = emailInput.value.trim();

    var cal = computeCalendar();
    var firstName = state.name ? state.name.split(' ')[0] : 'there';
    successTitle.textContent = 'Request sent, ' + firstName;
    successMeta.textContent = cal.label.split(' ')[0] + ' ' + state.selectedDay + ' · ' + state.type;

    form.hidden = true;
    successScreen.hidden = false;
    successScreen.classList.remove('pop-in');
    void successScreen.offsetWidth;
    successScreen.classList.add('pop-in');
  });

  document.getElementById('reset-btn').addEventListener('click', function () {
    state.selectedDay = null;
    state.name = '';
    state.email = '';
    nameInput.value = '';
    emailInput.value = '';
    document.getElementById('booking-venue').value = '';
    document.getElementById('booking-message').value = '';
    renderCalendar();
    renderSubmit();

    successScreen.hidden = true;
    form.hidden = false;
    form.classList.remove('screen-in');
    void form.offsetWidth;
    form.classList.add('screen-in');
  });

  renderCalendar();
  renderSubmit();
})();
