// Clock UI script for the webview
(function () {
  const t = document.getElementById("time");
  const d = document.getElementById("date");
  function pad(n) {
    return n < 10 ? "0" + n : n;
  }
  function update() {
    const now = new Date();
    if (t) {t.textContent = now.toLocaleTimeString();}
    if (d) {d.textContent = now.toLocaleDateString();}
  }
  setInterval(update, 1000);
  update();
})();
