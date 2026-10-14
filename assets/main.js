/*
 * Waitlist form – placeholder behaviour only.
 * Nothing is sent anywhere yet: on a valid submit the form is swapped for the
 * "check your inbox / invite your neighbours" panel. Replace the TODO below
 * with the real waitlist integration (double opt-in, EU data storage).
 */
(function () {
  var wrap = document.querySelector("[data-form-wrap]");
  if (!wrap) return;

  var form = wrap.querySelector("[data-waitlist-form]");
  var success = wrap.querySelector("[data-success]");
  var district = form.querySelector("#district");
  var town = form.querySelector("#town");

  // "Other town" needs a town name.
  function syncTown() {
    town.required = district.value === "other";
  }
  district.addEventListener("change", syncTown);
  syncTown();

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());
    data.lang = document.documentElement.lang;

    // TODO: send `data` to the waitlist service.
    console.info("Waitlist sign-up (placeholder, not sent):", data);

    wrap.classList.add("is-done");
    success.focus({ preventScroll: true });
  });

  // Share links point at the current page.
  var pageUrl = location.origin && location.origin !== "null" ? location.origin + location.pathname : location.href;
  var shareText = document.querySelector('meta[property="og:description"]').content;
  var targets = {
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(pageUrl),
    messenger: "fb-messenger://share/?link=" + encodeURIComponent(pageUrl),
    whatsapp: "https://wa.me/?text=" + encodeURIComponent(shareText + " " + pageUrl)
  };
  wrap.querySelectorAll("[data-share]").forEach(function (link) {
    link.href = targets[link.dataset.share];
  });

  var copy = wrap.querySelector("[data-copy]");
  if (copy) {
    copy.addEventListener("click", function () {
      var label = copy.querySelector("span");
      var original = label.textContent;
      var done = function () {
        label.textContent = copy.dataset.copiedText;
        setTimeout(function () { label.textContent = original; }, 2000);
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(pageUrl).then(done, function () {});
      }
    });
  }
})();
