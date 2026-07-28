(function () {
  var TOTAL_SEC = 222;
  var state = { isPlaying: true, progress: 38 };

  var progressFill = document.getElementById('progress-fill');
  var curTimeEl = document.getElementById('cur-time');
  var totalTimeEl = document.getElementById('total-time');
  var playBtn = document.getElementById('play-btn');
  var playIcon = document.getElementById('play-icon');
  var disc = document.getElementById('disc');
  var tonearm = document.getElementById('tonearm');

  var PLAY_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"></path></svg>';
  var PAUSE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect></svg>';

  function fmt(sec) {
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function renderPlayback() {
    progressFill.style.width = state.progress + '%';
    var curSec = Math.floor((TOTAL_SEC * state.progress) / 100);
    curTimeEl.textContent = fmt(curSec);
    totalTimeEl.textContent = fmt(TOTAL_SEC);

    playIcon.innerHTML = state.isPlaying ? PAUSE_SVG : PLAY_SVG;
    playBtn.setAttribute('aria-label', state.isPlaying ? 'Pause' : 'Play');

    disc.classList.toggle('disc-active', state.isPlaying);
    disc.classList.toggle('disc-idle', !state.isPlaying);
    tonearm.classList.toggle('tonearm-playing', state.isPlaying);
    tonearm.classList.toggle('tonearm-paused', !state.isPlaying);
  }

  playBtn.addEventListener('click', function () {
    state.isPlaying = !state.isPlaying;
    renderPlayback();
  });

  setInterval(function () {
    if (!state.isPlaying) return;
    state.progress = state.progress >= 100 ? 0 : state.progress + 0.4;
    renderPlayback();
  }, 200);

  renderPlayback();

  // ---------- scroll reveal ----------
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) entry.target.classList.add('in');
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ---------- hero particle field ----------
  var canvas = document.getElementById('hero-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var pointer = { x: -999, y: -999 };
    var raf = null;

    function setup() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        requestAnimationFrame(setup);
        return;
      }
      canvas.width = rect.width;
      canvas.height = rect.height;
      var cols = Math.round(rect.width / 60), rows = Math.round(rect.height / 60);
      particles = [];
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          particles.push({
            baseX: (i + 0.5) * (canvas.width / cols),
            baseY: (j + 0.5) * (canvas.height / rows),
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.3,
          });
        }
      }
      draw();
    }

    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var t = e.touches ? e.touches[0] : e;
      pointer = { x: t.clientX - r.left, y: t.clientY - r.top };
    }
    function onLeave() { pointer = { x: -999, y: -999 }; }

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('touchmove', onMove, { passive: true });
    canvas.addEventListener('touchend', onLeave);

    var gold = [240, 169, 31], red = [209, 56, 42];

    function draw() {
      var t = performance.now() / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        var x = p.baseX + Math.sin(t * p.speed + p.phase) * 8;
        var y = p.baseY + Math.cos(t * p.speed * 0.8 + p.phase) * 8;
        var dx = x - pointer.x, dy = y - pointer.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var influence = Math.max(0, 1 - dist / 140);
        if (influence > 0) {
          var push = influence * 30;
          var ang = Math.atan2(dy, dx);
          x += Math.cos(ang) * push;
          y += Math.sin(ang) * push;
        }
        var r = Math.round(gold[0] + (red[0] - gold[0]) * influence);
        var g = Math.round(gold[1] + (red[1] - gold[1]) * influence);
        var b = Math.round(gold[2] + (red[2] - gold[2]) * influence);
        var alpha = 0.3 + influence * 0.5;
        var radius = 1.8 + influence * 2.2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', function () {
      cancelAnimationFrame(raf);
      setup();
    });

    setup();
  }
})();
