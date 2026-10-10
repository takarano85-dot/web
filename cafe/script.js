// ===== スマホ用メニュー =====
const toggle = document.querySelector('.nav-toggle');
const spNav = document.getElementById('sp-nav');

function setMenu(open) {
  spNav.classList.toggle('is-open', open);
  toggle.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
}

toggle.addEventListener('click', () => setMenu(!spNav.classList.contains('is-open')));
spNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

// ===== 営業時間(曜日ごと) =====
// [開店, 閉店] を分で。水曜は定休日
const HOURS = { 0: [540, 1080], 1: [480, 1140], 2: [480, 1140], 3: null, 4: [480, 1140], 5: [480, 1260], 6: [540, 1140] };
const toTime = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

(function showStatus() {
  const now = new Date();
  const day = now.getDay();
  const min = now.getHours() * 60 + now.getMinutes();
  const h = HOURS[day];
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  const row = document.querySelector(`#week tr[data-day="${day}"]`);
  if (row) row.classList.add('is-today');

  if (!h) {
    text.textContent = '今日は定休日です。また明日！';
  } else if (min >= h[0] && min < h[1]) {
    dot.classList.add('is-open');
    text.textContent = `ただいま営業中 ・ ${toTime(h[1])}まで`;
  } else if (min < h[0]) {
    text.textContent = `今日は ${toTime(h[0])} からオープン`;
  } else {
    text.textContent = '今日の営業は終了しました';
  }
})();

// ===== メニューのタブ =====
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-selected', t === tab);
    });
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
  });
});

// ===== 席の予約 =====
const form = document.getElementById('reserve-form');
const fields = document.getElementById('form-fields');
const confirmBox = document.getElementById('form-confirm');
const doneBox = document.getElementById('reserve-done');
const dateInput = document.getElementById('f-date');
const timeSelect = document.getElementById('f-time');
const errorBox = document.getElementById('form-error');
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

const pad = n => String(n).padStart(2, '0');
const today = new Date();
dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

// その日の営業時間に合わせて、30分ごとの時間を出す(閉店1時間前まで)
function updateTimes() {
  const d = dateInput.value ? new Date(dateInput.value + 'T00:00') : null;
  const h = d ? HOURS[d.getDay()] : [480, 1140];
  const current = timeSelect.value;
  timeSelect.innerHTML = '<option value="">選択</option>';
  if (!h) return;
  for (let m = h[0]; m <= h[1] - 60; m += 30) {
    const t = toTime(m);
    timeSelect.add(new Option(t, t, false, t === current));
  }
}
updateTimes();
dateInput.addEventListener('change', updateTimes);

form.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('is-error'));
});

function dateText() {
  const d = new Date(dateInput.value + 'T00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]}) ${timeSelect.value}〜`;
}

form.addEventListener('submit', e => {
  e.preventDefault();
  errorBox.textContent = '';

  if (dateInput.value && !HOURS[new Date(dateInput.value + 'T00:00').getDay()]) {
    dateInput.classList.add('is-error');
    errorBox.textContent = '水曜日は定休日です。別の日を選んでください。';
    return;
  }
  const invalid = [...form.querySelectorAll('[required]')].filter(el => !el.checkValidity());
  if (invalid.length) {
    invalid.forEach(el => el.classList.add('is-error'));
    errorBox.textContent = '必須の項目を入力してください。';
    invalid[0].focus();
    return;
  }

  const data = new FormData(form);
  const rows = [
    ['お名前', data.get('name')],
    ['電話番号', data.get('tel')],
    ['日時', dateText()],
    ['人数', data.get('people')],
    ['席', data.get('seat')],
  ];
  const list = document.getElementById('confirm-list');
  list.innerHTML = '';
  rows.forEach(([k, v]) => {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = k;
    dd.textContent = v;
    row.append(dt, dd);
    list.append(row);
  });

  fields.hidden = true;
  confirmBox.hidden = false;
  form.scrollIntoView({ block: 'start' });
});

document.getElementById('confirm-back').addEventListener('click', () => {
  confirmBox.hidden = true;
  fields.hidden = false;
});

document.getElementById('confirm-ok').addEventListener('click', () => {
  const data = new FormData(form);
  const text = document.getElementById('done-text');
  text.textContent = '';
  [`${data.get('name')} 様`, dateText(), `${data.get('people')} ・ ${data.get('seat')}`, 'お会いできるのを楽しみにしています。'].forEach((line, i) => {
    if (i) text.append(document.createElement('br'));
    text.append(line);
  });
  form.hidden = true;
  doneBox.hidden = false;
  doneBox.scrollIntoView({ block: 'center' });
});
