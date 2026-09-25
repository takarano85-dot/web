// ===== ローディング =====
document.body.classList.add('is-loading');
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('loader').classList.add('is-done');
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
  }, 1300);
});

// ===== スマホ用メニューの開閉 =====
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

// ===== スクロールしたときの動き =====
const header = document.getElementById('header');
const progress = document.getElementById('progress');
const toTop = document.getElementById('to-top');

function onScroll() {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  header.classList.toggle('is-scrolled', y > 40);
  toTop.classList.toggle('is-show', y > 600);
  progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 画面に入ったらふわっと表示
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-show');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== 今営業中かどうか =====
(function showStatus() {
  const now = new Date();
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const weekend = day === 0 || day === 6;
  const open = weekend ? 10 * 60 : 11 * 60;
  const close = weekend ? 19 * 60 : 20 * 60;
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  if (day === 2) {
    text.textContent = '本日は定休日です';
  } else if (minutes >= open && minutes < close) {
    dot.classList.add('is-open');
    text.textContent = `ただいま営業中(${close / 60}:00まで)`;
  } else if (minutes < open) {
    text.textContent = `本日は${open / 60}:00から営業します`;
  } else {
    text.textContent = '本日の営業は終了しました';
  }
})();

// ===== メニューのタブ =====
const tabs = document.querySelectorAll('.menu__tab');
const panels = document.querySelectorAll('.menu__panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-selected', t === tab);
    });
    panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
  });
});

// ===== スタイルの絞り込み =====
const filterBtns = document.querySelectorAll('.filter__btn');
const items = document.querySelectorAll('.gallery__item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    items.forEach(item => {
      item.classList.toggle('is-hidden', f !== 'all' && item.dataset.cat !== f);
    });
  });
});

// ===== スタイルの詳細(モーダル) =====
const modal = document.getElementById('modal');
let lastFocus = null;
let currentStyle = '';

items.forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    currentStyle = img.alt;
    document.getElementById('modal-img').src = img.src;
    document.getElementById('modal-img').alt = img.alt;
    document.getElementById('modal-cat').textContent = item.querySelector('small').textContent;
    document.getElementById('modal-title').textContent = img.alt;
    document.getElementById('modal-desc').textContent = item.dataset.desc;
    document.getElementById('modal-staff').textContent = item.dataset.staff;
    lastFocus = item;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    modal.querySelector('.modal__close').focus();
  });
});

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) closeModal();
});

// 「このスタイルで予約する」を押したら要望欄に入れておく
document.getElementById('modal-reserve').addEventListener('click', () => {
  const staff = document.getElementById('modal-staff').textContent;
  document.getElementById('f-note').value = `「${currentStyle}」のスタイルを希望します。`;
  document.getElementById('f-staff').value = staff;
  modal.hidden = true;
  document.body.style.overflow = '';
});

// ===== お客さまの声のスライダー =====
const track = document.getElementById('voice-track');

function slide(dir) {
  const card = track.querySelector('.voice__card');
  const step = card.offsetWidth + 24;
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
  if (dir > 0 && atEnd) {
    track.scrollTo({ left: 0 });
  } else {
    track.scrollBy({ left: step * dir });
  }
}

document.querySelectorAll('.voice__arrow').forEach(btn => {
  btn.addEventListener('click', () => slide(Number(btn.dataset.dir)));
});

// 5秒ごとに自動で流す(触っている間は止める)
let autoSlide = setInterval(() => slide(1), 5000);
track.addEventListener('pointerenter', () => clearInterval(autoSlide));
track.addEventListener('pointerleave', () => {
  clearInterval(autoSlide);
  autoSlide = setInterval(() => slide(1), 5000);
});

// ===== 予約フォーム =====
const form = document.getElementById('reserve-form');
const fields = document.getElementById('form-fields');
const confirmBox = document.getElementById('form-confirm');
const doneBox = document.getElementById('reserve-done');
const dateInput = document.getElementById('f-date');
const timeSelect = document.getElementById('f-time');
const errorBox = document.getElementById('form-error');
const steps = document.querySelectorAll('.form__steps li');
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

function setStep(n) {
  steps.forEach((li, i) => li.classList.toggle('is-active', i <= n));
}

// 今日より前は選べないようにする
const today = new Date();
const pad = n => String(n).padStart(2, '0');
dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

// 曜日によって受付時間を変える(平日は19:00まで、土日は18:00まで)
function updateTimes() {
  const d = dateInput.value ? new Date(dateInput.value + 'T00:00') : null;
  const weekend = d && (d.getDay() === 0 || d.getDay() === 6);
  const start = weekend ? 10 : 11;
  const end = weekend ? 18 : 19;
  const current = timeSelect.value;
  timeSelect.innerHTML = '<option value="">選択してください</option>';
  for (let h = start; h <= end; h++) {
    ['00', '30'].forEach(m => {
      if (h === end && m === '30') return;
      const t = `${h}:${m}`;
      timeSelect.add(new Option(t, t, false, t === current));
    });
  }
}
updateTimes();
dateInput.addEventListener('change', updateTimes);

// 入力し直したら赤枠を消す
form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('is-error'));
});

form.addEventListener('submit', e => {
  e.preventDefault();
  errorBox.textContent = '';
  form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));

  const invalid = [...form.querySelectorAll('[required]')].filter(el => !el.checkValidity());
  if (invalid.length) {
    invalid.forEach(el => el.classList.add('is-error'));
    errorBox.textContent = '必須の項目を入力してください。';
    invalid[0].focus();
    return;
  }
  const mail = document.getElementById('f-mail');
  if (!mail.checkValidity()) {
    mail.classList.add('is-error');
    errorBox.textContent = 'メールアドレスの形がちがうようです。';
    return;
  }
  const d = new Date(dateInput.value + 'T00:00');
  if (d.getDay() === 2) {
    dateInput.classList.add('is-error');
    errorBox.textContent = '火曜日は定休日です。別の日を選んでください。';
    return;
  }

  // 確認画面を作る
  const data = new FormData(form);
  const rows = [
    ['お名前', data.get('name')],
    ['電話番号', data.get('tel')],
    ['メール', data.get('mail') || '未入力'],
    ['日時', `${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]}) ${data.get('time')}〜`],
    ['メニュー', data.get('menu')],
    ['指名', data.get('staff')],
    ['ご来店', data.get('visit')],
    ['ご要望', data.get('note') || 'なし'],
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
  setStep(1);
  form.scrollIntoView({ block: 'start' });
});

document.getElementById('confirm-back').addEventListener('click', () => {
  confirmBox.hidden = true;
  fields.hidden = false;
  setStep(0);
});

document.getElementById('confirm-ok').addEventListener('click', () => {
  const data = new FormData(form);
  const d = new Date(dateInput.value + 'T00:00');
  const text = document.getElementById('done-text');
  text.textContent = '';
  [
    `${data.get('name')} 様`,
    `${d.getMonth() + 1}月${d.getDate()}日(${WEEK[d.getDay()]}) ${data.get('time')}〜`,
    `${data.get('menu')} / ${data.get('staff')}`,
    'ご来店を楽しみにお待ちしています。',
  ].forEach((line, i) => {
    if (i) text.append(document.createElement('br'));
    text.append(line);
  });
  form.hidden = true;
  doneBox.hidden = false;
  doneBox.scrollIntoView({ block: 'center' });
});
