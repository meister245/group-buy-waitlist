/*
 * Waitlist form.
 * A valid submit is posted as JSON to the sign-up API (backend/, served by
 * CloudFront at /api/signup on the same domain), which stores it and sends the
 * confirmation email. On success the form is swapped for the
 * "check your inbox / share in your area" panel.
 * When the page is opened straight from disk, nothing is sent (local preview).
 */

// Message after following the confirm or unsubscribe link in the email
// (the API redirects back with ?confirmed=1, ?confirmed=0 or ?unsubscribed=1).
(function () {
  var notice = document.querySelector("[data-notice]");
  if (!notice) return;

  var params = new URLSearchParams(location.search);
  var key = params.get("confirmed") === "1" ? "confirmed"
    : params.get("confirmed") === "0" ? "expired"
    : params.get("unsubscribed") === "1" ? "unsubscribed"
    : null;
  if (!key) return;

  notice.querySelector("[data-notice-text]").textContent = notice.dataset[key];
  notice.classList.toggle("is-warning", key === "expired");
  notice.hidden = false;
  notice.querySelector("[data-notice-close]").addEventListener("click", function () {
    notice.hidden = true;
  });

  // Drop the parameter so a reload or a shared link doesn't show the message again.
  history.replaceState(null, "", location.pathname + location.hash);
})();

(function () {
  var wrap = document.querySelector("[data-form-wrap]");
  if (!wrap) return;

  var form = wrap.querySelector("[data-waitlist-form]");
  var success = wrap.querySelector("[data-success]");
  var error = form.querySelector("[data-error]");
  var button = form.querySelector('button[type="submit"]');
  var endpoint = location.protocol === "file:" ? "" : form.dataset.endpoint;

  function showSuccess() {
    wrap.classList.add("is-done");
    success.focus({ preventScroll: true });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    error.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());
    data.lang = document.documentElement.lang;

    if (!endpoint) {
      console.info("Waitlist sign-up (local preview, not sent):", data);
      showSuccess();
      return;
    }

    button.disabled = true;
    button.setAttribute("aria-busy", "true");

    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        if (!body.ok) throw new Error(body.error);
        showSuccess();
      })
      .catch(function () {
        error.hidden = false;
        button.disabled = false;
        button.removeAttribute("aria-busy");
      });
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
