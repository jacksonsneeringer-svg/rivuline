/* Flowing current lines — layered sines drawn on a full-bleed canvas.
   Shared by every page's backdrop. No-ops when #waves is absent. */
(function () {
  var canvas = document.getElementById('waves');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var W = 0, H = 0, dpr = 1;
  var LINES = 16;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Layered sines -> smooth, non-repeating-looking current
  function offset(x, t, i) {
    var k = 1 + i * 0.06;
    return (
      Math.sin(x * 0.0042 * k + t * 0.22 + i * 0.55) * 26 +
      Math.sin(x * 0.0091 * k - t * 0.31 + i * 1.3) * 13 +
      Math.sin(x * 0.0019 - t * 0.14 + i * 0.27) * 38
    );
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < LINES; i++) {
      var p = i / (LINES - 1);            // 0 (top) -> 1 (bottom)
      var baseY = H * (0.12 + p * 0.82);
      var depth = Math.sin(p * Math.PI);  // strongest mid-frame

      ctx.beginPath();
      var step = 14;
      for (var x = -40; x <= W + 40; x += step) {
        var y = baseY + offset(x, t, i) * (0.45 + depth * 0.85);
        if (x === -40) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      var g = ctx.createLinearGradient(0, 0, W, 0);
      var a = (0.05 + depth * 0.13) * (1 - p * 0.35);
      g.addColorStop(0,    'rgba(127,224,216,0)');
      g.addColorStop(0.2,  'rgba(127,224,216,' + a.toFixed(3) + ')');
      g.addColorStop(0.5,  'rgba(168,238,235,' + (a * 1.35).toFixed(3) + ')');
      g.addColorStop(0.8,  'rgba(108,168,230,' + a.toFixed(3) + ')');
      g.addColorStop(1,    'rgba(108,168,230,0)');

      ctx.strokeStyle = g;
      ctx.lineWidth = 0.9 + depth * 0.9;
      ctx.stroke();
    }
  }

  var start = null, raf = null;
  function frame(now) {
    if (start === null) start = now;
    draw((now - start) / 1000);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (raf === null && !reduce.matches) raf = requestAnimationFrame(frame);
  }
  function pause() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }

  resize();
  draw(0);
  if (!reduce.matches) play();

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); draw(raf === null ? 0 : performance.now() / 1000); }, 120);
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) pause();
    else { start = null; play(); }
  });

  if (reduce.addEventListener) {
    reduce.addEventListener('change', function () {
      if (reduce.matches) { pause(); draw(0); } else { start = null; play(); }
    });
  }
})();
