// ===== スマホ用メニュー =====
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

function setMenu(open) {
  nav.classList.toggle('is-open', open);
  toggle.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
}

toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

// ===== 画面に入ったらふわっと表示(画面より下にあるものだけ) =====
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.remove('is-hidden');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => {
  if (el.getBoundingClientRect().top > window.innerHeight) {
    el.classList.add('is-hidden');
    observer.observe(el);
  }
});

// ===== 予約フォーム =====
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

// 受付は10:00〜18:30(30分ごと)
for (let h = 10; h <= 18; h++) {
  ['00', '30'].forEach(m => timeSelect.add(new Option(`${h}:${m}`, `${h}:${m}`)));
}

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

  const invalid = [...form.querySelectorAll('[required]')].filter(el => !el.checkValidity());
  if (invalid.length) {
    invalid.forEach(el => el.classList.add('is-error'));
    errorBox.textContent = '必須の項目を入力してください。';
    invalid[0].focus();
    return;
  }
  if (new Date(dateInput.value + 'T00:00').getDay() === 3) {
    dateInput.classList.add('is-error');
    errorBox.textContent = '水曜日は定休日です。別の日を選んでください。';
    return;
  }

  const data = new FormData(form);
  const rows = [
    ['お名前', data.get('name')],
    ['電話番号', data.get('tel')],
    ['日時', dateText()],
    ['メニュー', data.get('menu')],
    ['他店オフ', data.get('off')],
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
  [`${data.get('name')} 様`, dateText(), data.get('menu'), 'ご来店をお待ちしています。'].forEach((line, i) => {
    if (i) text.append(document.createElement('br'));
    text.append(line);
  });
  form.hidden = true;
  doneBox.hidden = false;
  doneBox.scrollIntoView({ block: 'center' });
});
