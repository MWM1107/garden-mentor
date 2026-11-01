/* GardenMentor prototype — vanilla JS, no build step. */
(function () {
  'use strict';

  /* ---------- Constants & state ---------- */

  var VIEW_NAMES = ['calendar', 'home', 'create_post', 'view_post'];
  var SIZE_KEY = 'gardenmentor-text-size';

  var DEFAULT_TEXT =
    'This is my first tomato plant. I noticed some curling on the leaves during my morning watering. Is it doing okay so far?';

  // Inline SVG illustration so the prototype never depends on an external image host.
  var TOMATO_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#d9ebf5"/>' +
    '<circle cx="335" cy="55" r="28" fill="#ffd95a"/>' +
    '<rect y="238" width="400" height="62" fill="#7a5230"/>' +
    '<rect y="238" width="400" height="8" fill="#5e3d21"/>' +
    '<rect x="272" y="40" width="8" height="205" fill="#b8925f"/>' +
    '<path d="M200 245 C192 205 210 165 198 120 C192 95 200 70 206 55" fill="none" stroke="#2f6f23" stroke-width="9" stroke-linecap="round"/>' +
    // leaves
    '<g fill="#4c9a37" stroke="#2f6f23" stroke-width="3">' +
    '<path d="M196 90 C150 60 110 85 120 115 C150 125 185 112 196 90Z"/>' +
    '<path d="M204 75 C250 40 292 62 282 94 C252 104 215 96 204 75Z"/>' +
    '<path d="M197 150 C150 125 108 150 120 182 C152 190 188 175 197 150Z"/>' +
    '<path d="M200 135 C246 112 288 135 276 168 C246 176 212 160 200 135Z"/>' +
    '<path d="M198 205 C160 185 124 205 134 232 C160 238 190 226 198 205Z"/>' +
    '</g>' +
    // leaf curl (slightly darker rolled edges) and veins
    '<g fill="none" stroke="#2a6020" stroke-width="3" stroke-linecap="round">' +
    '<path d="M122 112 C140 120 170 116 190 98"/>' +
    '<path d="M282 92 C262 100 232 98 210 82"/>' +
    '<path d="M122 178 C142 186 170 182 190 160"/>' +
    '<path d="M274 166 C254 172 226 166 206 146"/>' +
    '<path d="M196 92 L130 108 M204 77 L270 88 M197 152 L130 176 M200 137 L266 160"/>' +
    '</g>' +
    // tomatoes
    '<g>' +
    '<circle cx="168" cy="205" r="25" fill="#d8352a"/>' +
    '<circle cx="232" cy="190" r="29" fill="#e0402d"/>' +
    '<circle cx="222" cy="232" r="21" fill="#7fb33b"/>' +
    '<ellipse cx="160" cy="196" rx="6" ry="9" fill="#fff" opacity=".35"/>' +
    '<ellipse cx="223" cy="180" rx="7" ry="10" fill="#fff" opacity=".35"/>' +
    '<path d="M168 182 l-7 7 l7 -2 l7 2 z M232 160 l-8 8 l8 -3 l8 3 z M222 213 l-6 6 l6 -2 l6 2 z" fill="#2f6f23"/>' +
    '</g>' +
    '</svg>';
  var TOMATO_PHOTO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(TOMATO_SVG);
  var TOMATO_ALT = 'Sample photo: a young tomato plant with curling leaves and a few ripening tomatoes.';

  var state = {
    crop: 'Tomatoes',
    text: DEFAULT_TEXT,
    photo: TOMATO_PHOTO,
    photoAlt: TOMATO_ALT
  };
  var draft = { photo: TOMATO_PHOTO, photoAlt: TOMATO_ALT };

  var EXPERT_FOLLOW_UPS = [
    'Great question! Keep watering at the base of the plant in the morning, and try not to splash the leaves. If the curl stays the same or gets worse over the next week, post a new photo and I will take another look.',
    'Thanks for the update. As long as the new growth at the top looks green and perky, there is nothing to worry about. Remember to cover the plant on the nights of the frost warning.',
    'Happy to help! A light feeding of vegetable fertilizer once a week is plenty. Check the lower leaves for aphids when you water and let me know if you spot any.'
  ];

  var pendingTimers = [];
  var followUpCount = 0;

  /* ---------- Helpers ---------- */

  function $(selector, root) { return (root || document).querySelector(selector); }
  function $all(selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }

  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  /* ---------- Routing (hash based so Back/Forward and GitHub Pages both work) ---------- */

  var firstRoute = true;

  function currentViewName() {
    var name = window.location.hash.replace(/^#\/?/, '');
    return VIEW_NAMES.indexOf(name) === -1 ? 'calendar' : name;
  }

  function route() {
    var name = currentViewName();
    var title = '';

    $all('.view').forEach(function (section) {
      var active = section.getAttribute('data-view') === name;
      section.hidden = !active;
      if (active) title = section.getAttribute('data-title');
    });

    $all('.nav-btn').forEach(function (btn) {
      if (btn.getAttribute('data-go') === name) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    document.title = title + ' – GardenMentor';

    if (!firstRoute) {
      window.scrollTo(0, 0);
      var heading = $('.view[data-view="' + name + '"] h1');
      if (heading) heading.focus({ preventScroll: true });
    }
    firstRoute = false;
  }

  function go(name) {
    if (currentViewName() === name && window.location.hash === '#/' + name) {
      route();
    } else {
      window.location.hash = '#/' + name;
    }
  }

  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-go]');
    if (trigger) go(trigger.getAttribute('data-go'));
  });
  window.addEventListener('hashchange', route);

  /* ---------- Text size ---------- */

  function applyTextSize(size) {
    document.documentElement.style.fontSize = size;
    $all('.size-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-size') === size));
    });
  }

  $all('.size-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var size = btn.getAttribute('data-size');
      applyTextSize(size);
      try { window.localStorage.setItem(SIZE_KEY, size); } catch (e) { /* storage unavailable */ }
    });
  });

  (function restoreTextSize() {
    var saved = null;
    try { saved = window.localStorage.getItem(SIZE_KEY); } catch (e) { /* storage unavailable */ }
    var valid = $all('.size-btn').some(function (btn) { return btn.getAttribute('data-size') === saved; });
    applyTextSize(valid ? saved : '16px');
  })();

  /* ---------- View 1: Calendar ---------- */

  var YEAR = 2026;
  var MONTH = 9; // October (0-based)
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var PLANT_DATES = [7, 21];    // two Wednesdays
  var HARVEST_DATES = [10, 24]; // two Saturdays
  var FROST_START = 15;
  var FROST_END = 22;

  function tasksFor(date, weekday) {
    var tasks = [];
    if (weekday === 1 || weekday === 5) tasks.push({ icon: '💧', text: 'Water deeply in the morning' });
    if (weekday === 3 && PLANT_DATES.indexOf(date) !== -1) tasks.push({ icon: '🌱', text: 'Plant / Apply vegetable fertilizer' });
    if (weekday === 6 && HARVEST_DATES.indexOf(date) !== -1) tasks.push({ icon: '🍅', text: 'Harvest check' });
    return tasks;
  }

  function buildCalendar() {
    var body = $('#calendar tbody');
    var firstWeekday = new Date(YEAR, MONTH, 1).getDay();
    var daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
    var date = 1;
    var row;

    for (var cell = 0; date <= daysInMonth; cell++) {
      if (cell % 7 === 0) {
        row = document.createElement('tr');
        body.appendChild(row);
      }
      var td = document.createElement('td');

      if (cell < firstWeekday) {
        td.className = 'pad';
      } else {
        var weekday = cell % 7;
        var tasks = tasksFor(date, weekday);
        var inFrost = date >= FROST_START && date <= FROST_END;
        var spoken = DAY_NAMES[weekday] + ', October ' + date + ': ' +
          (tasks.length ? tasks.map(function (t) { return t.text; }).join('; ') : 'no scheduled tasks') +
          (inFrost ? '. First frost warning window.' : '.');

        var num = document.createElement('span');
        num.className = 'cal-num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = date;
        if (inFrost) {
          td.className = 'frost';
          var snow = document.createElement('span');
          snow.className = 'cal-frost';
          snow.textContent = '❄️';
          num.appendChild(snow);
        }

        var icons = document.createElement('span');
        icons.className = 'cal-icons';
        icons.setAttribute('aria-hidden', 'true');
        icons.textContent = tasks.map(function (t) { return t.icon; }).join('');

        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = spoken;

        td.appendChild(num);
        td.appendChild(icons);
        td.appendChild(sr);
        date++;
      }
      row.appendChild(td);
    }

    // Pad the last row out to 7 cells.
    while (row.children.length < 7) {
      var filler = document.createElement('td');
      filler.className = 'pad';
      row.appendChild(filler);
    }
  }

  $('#print-btn').addEventListener('click', function () { window.print(); });

  /* ---------- View 3: Create post ---------- */

  var photoInput = $('#photo-input');
  var fileStatus = $('#file-status');
  var previewImg = $('#preview-img');
  var cropSelect = $('#crop-select');
  var postText = $('#post-text');
  var postError = $('#post-error');

  function setPreview(src, alt) {
    previewImg.src = src;
    previewImg.alt = alt;
  }

  photoInput.addEventListener('change', function () {
    var file = photoInput.files && photoInput.files[0];
    if (!file) return;

    if (file.type.indexOf('image/') !== 0) {
      fileStatus.textContent = 'That file is not a picture. Please choose a photo (JPG, PNG, etc.).';
      photoInput.value = '';
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      draft.photo = reader.result;
      draft.photoAlt = 'Your uploaded photo: ' + file.name;
      setPreview(draft.photo, draft.photoAlt);
      fileStatus.textContent = 'Attached: ' + file.name;
    };
    reader.onerror = function () {
      fileStatus.textContent = 'Sorry, that photo could not be read. Please try another one.';
    };
    reader.readAsDataURL(file);
  });

  postText.addEventListener('input', function () { hide(postError); });

  $('#post-form').addEventListener('submit', function (event) {
    event.preventDefault();

    var text = postText.value.trim();
    if (!text) {
      postError.textContent = 'Please add a few words about your plant before posting.';
      show(postError);
      postText.focus();
      return;
    }

    hide(postError);
    state.crop = cropSelect.value;
    state.text = text;
    state.photo = draft.photo;
    state.photoAlt = draft.photoAlt;

    renderPost();
    resetConversation();
    go('view_post');
  });

  /* ---------- View 4: Mentorship board ---------- */

  var postImg = $('#post-img');
  var thread = $('#thread');
  var threadEmpty = $('#thread-empty');
  var ratingMsg = $('#rating-msg');
  var replyInput = $('#reply-input');
  var replyError = $('#reply-error');

  function renderPost() {
    postImg.src = state.photo;
    postImg.alt = state.photoAlt;
    $('#post-crop').textContent = state.crop;
    $('#post-body-text').textContent = state.text;
  }

  function resetConversation() {
    pendingTimers.forEach(clearTimeout);
    pendingTimers = [];
    followUpCount = 0;
    $all('.msg', thread).forEach(function (node) { node.remove(); });
    show(threadEmpty);
    hide(ratingMsg);
    ratingMsg.textContent = '';
    replyInput.value = '';
    hide(replyError);
  }

  $all('[data-rate]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      ratingMsg.textContent = btn.getAttribute('data-rate') === 'yes'
        ? '✅ Thank you! We\'re glad Dr. Walker\'s reply was helpful.'
        : '💬 Thanks for letting us know. We\'ve flagged this reply for clarification. Type your question in the follow-up box below and Dr. Walker will respond.';
      show(ratingMsg);
    });
  });

  function addMessage(kind, who, text) {
    hide(threadEmpty);
    var msg = document.createElement('div');
    msg.className = 'msg msg-' + kind;

    var name = document.createElement('p');
    name.className = 'msg-who';
    name.textContent = who;

    var body = document.createElement('p');
    body.textContent = text;

    msg.appendChild(name);
    msg.appendChild(body);
    thread.appendChild(msg);
    thread.scrollTop = thread.scrollHeight;
    return msg;
  }

  replyInput.addEventListener('input', function () { hide(replyError); });

  $('#reply-form').addEventListener('submit', function (event) {
    event.preventDefault();

    var text = replyInput.value.trim();
    if (!text) {
      show(replyError);
      replyInput.focus();
      return;
    }

    addMessage('user', '@Novice_Gardener', text);
    replyInput.value = '';
    hide(replyError);
    replyInput.focus();

    var typing = addMessage('expert', '@Dr_Walker_Horticulturalist', 'Typing…');
    typing.classList.add('msg-typing');

    var reply = EXPERT_FOLLOW_UPS[followUpCount % EXPERT_FOLLOW_UPS.length];
    followUpCount++;

    var timer = setTimeout(function () {
      typing.remove();
      addMessage('expert', '@Dr_Walker_Horticulturalist', reply);
    }, 1000);
    pendingTimers.push(timer);
  });

  /* ---------- Footer ---------- */

  var INFO = {
    privacy: {
      title: 'Privacy Policy',
      html: '<p>GardenMentor is a prototype. It does not collect, send or store any personal information.</p>' +
            '<ul><li>Photos and messages you add stay in your browser tab and disappear when you refresh or close the page.</li>' +
            '<li>The only thing saved on your device is your Text Size choice.</li></ul>'
    },
    terms: {
      title: 'Terms of Use',
      html: '<p>This prototype is for demonstration only.</p>' +
            '<ul><li>Expert replies shown here are samples, not real horticultural advice.</li>' +
            '<li>The hotline number 1-800-555-GROW is an example and may not connect to anyone.</li></ul>'
    },
    accessibility: {
      title: 'Accessibility',
      html: '<p>GardenMentor is designed to be easy to read and use at any age.</p>' +
            '<ul><li>Three text sizes: Normal, Large and Extra Large, saved for your next visit.</li>' +
            '<li>High-contrast colors and large buttons.</li>' +
            '<li>Everything works with a keyboard, and the pages are labeled for screen readers.</li>' +
            '<li>Prefer to talk? Call the Expert Hotline at 1-800-555-GROW.</li></ul>'
    }
  };

  var infoDialog = $('#info-dialog');
  var infoTrigger = null;

  $all('[data-info]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var info = INFO[btn.getAttribute('data-info')];
      $('#info-title').textContent = info.title;
      $('#info-body').innerHTML = info.html; // static strings defined above
      infoTrigger = btn;
      infoDialog.showModal();
    });
  });
  $('#info-close').addEventListener('click', function () { infoDialog.close(); });
  infoDialog.addEventListener('click', function (event) {
    if (event.target === infoDialog) infoDialog.close(); // click on the backdrop
  });
  infoDialog.addEventListener('close', function () { if (infoTrigger) infoTrigger.focus(); });

  $('#to-top').addEventListener('click', function () {
    window.scrollTo(0, 0);
    var heading = $('.view:not([hidden]) h1');
    if (heading) heading.focus({ preventScroll: true });
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Init ---------- */

  buildCalendar();
  setPreview(draft.photo, draft.photoAlt);
  renderPost();
  route();
})();
