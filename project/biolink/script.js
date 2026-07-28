// Email capture — client-side only. No backend endpoint exists yet in this
// repo to submit to (see CODING_AGENT_BRIEF.md for the separate real bobprod
// site/API), so this just gives the visitor feedback and stops the
// unhandled GET-navigation a plain <form> would otherwise trigger.
(function () {
  var form = document.getElementById('subscribe-form');
  if (!form) return;

  var button = form.querySelector('.subscribe-btn');
  var input = form.querySelector('.email-input');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!input.checkValidity()) {
      input.reportValidity();
      return;
    }
    button.textContent = 'Thanks!';
    button.disabled = true;
    input.disabled = true;
  });
})();
