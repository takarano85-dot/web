// ===== スマホ用メニュー =====
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');

function setMenu(open) {
  nav.classList.toggle('is-open', open);
  toggle.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  document.body.style.overflow = open ? 'hidden' : '';
}
toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

// ===== 営業中かどうか(平日 7-22時 / 土日 8-19時) =====
const pad = n => String(n).padStart(2, '0');
const now = new Date();
const isWeekend = d => d === 0 || d === 6;

(function showOpen() {
  const el = document.getElementById('open-now');
  const [open, close] = isWeekend(now.getDay()) ? [8, 19] : [7, 22];
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= open && h < close) {
    el.classList.add('is-open');
    el.textContent = `Open now — until ${close}:00`;
  } else {
    el.textContent = h < open ? `Closed — opens ${open}:00` : 'Closed — see you tomorrow';
  }
})();

// ===== レッスンスケジュール =====
const MAX = { Beginner: 6, Basic: 6, Flow: 6, Tower: 4 };
const JA = { Beginner: 'はじめての方', Basic: '姿勢・体幹', Flow: 'しっかり動く', Tower: 'ほぐして伸ばす' };
const WEEKDAY = [
  ['07:15', 'Basic', 'Sora'], ['09:00', 'Beginner', 'Sora'], ['10:30', 'Tower', 'Ren'],
  ['12:15', 'Basic', 'Mika'], ['18:30', 'Beginner', 'Ren'], ['19:45', 'Flow', 'Mika'], ['21:00', 'Basic', 'Ren'],
];
const WEEKEND = [
  ['08:30', 'Beginner', 'Sora'], ['10:00', 'Flow', 'Mika'], ['11:30', 'Basic', 'Mika'],
  ['13:30', 'Tower', 'Ren'], ['15:00', 'Beginner', 'Ren'], ['17:00', 'Basic', 'Sora'],
];
// 水曜は夜のFlowをTowerに、金曜は朝をFlowに(少しだけ変化をつける)
function lessonsOf(date) {
  const d = date.getDay();
  if (isWeekend(d)) return WEEKEND;
  return WEEKDAY.map(l => {
    if (d === 3 && l[0] === '19:45') return ['19:45', 'Tower', 'Ren'];
    if (d === 5 && l[0] === '07:15') return ['07:15', 'Flow', 'Mika'];
    return l;
  });
}
// 残り枠は日付と時間から決まるダミーの数
function spotsLeft(date, time, cls) {
  const key = `${date.getMonth()}${date.getDate()}${time}`;
  let h = 2166136261;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % (MAX[cls] + 1);
}
const isPast = (date, time) => {
  const [hh, mm] = time.split(':').map(Number);
  const t = new Date(date);
  t.setHours(hh, mm, 0, 0);
  return t <= now;
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_JA = ['日', '月', '火', '水', '木', '金', '土'];
const days = [];
for (let i = 0; i < 7; i++) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
  days.push(d);
}
let activeDay = 0;
let activeLv = 'all';

const daysBox = document.getElementById('days');
const slotsBox = document.getElementById('slots');

days.forEach((d, i) => {
  const b = document.createElement('button');
  b.className = 'day';
  b.setAttribute('role', 'tab');
  b.innerHTML = `<small>${i === 0 ? 'Today' : DOW[d.getDay()]}</small><b>${d.getDate()}</b><small>${d.getMonth() + 1}月 ${DOW_JA[d.getDay()]}</small>`;
  b.addEventListener('click', () => { activeDay = i; renderSlots(); });
  daysBox.append(b);
});

document.querySelectorAll('#filter button').forEach(btn => {
  btn.addEventListener('click', () => {
    activeLv = btn.dataset.lv;
    document.querySelectorAll('#filter button').forEach(b => b.classList.toggle('is-active', b === btn));
    renderSlots();
  });
});

function renderSlots() {
  [...daysBox.children].forEach((b, i) => {
    b.classList.toggle('is-active', i === activeDay);
    b.setAttribute('aria-selected', i === activeDay);
  });
  const date = days[activeDay];
  const list = lessonsOf(date).filter(l => activeLv === 'all' || l[1] === activeLv);
  slotsBox.innerHTML = '';

  if (!list.length) {
    slotsBox.innerHTML = '<li class="slots__empty">この日は、このクラスのレッスンがありません。</li>';
    return;
  }
  list.forEach(([time, cls, who]) => {
    const left = spotsLeft(date, time, cls);
    const past = isPast(date, time);
    const li = document.createElement('li');
    li.className = 'slot';
    li.innerHTML = `
      <span class="slot__time">${time}</span>
      <span class="slot__name">${cls}<small>${JA[cls]}</small></span>
      <span class="slot__who">with ${who}</span>
      <span class="slot__left${left > 0 && left <= 2 ? ' is-few' : ''}">${past ? '—' : left === 0 ? 'FULL' : `残り ${left}`}</span>
      <button class="slot__btn" ${past || left === 0 ? 'disabled' : ''}>${past ? '終了' : left === 0 ? '満席' : 'この枠で予約'}</button>`;
    li.querySelector('.slot__btn').addEventListener('click', () => pickSlot(date, time, cls));
    slotsBox.append(li);
  });
}
renderSlots();

// ===== 料金シミュレーター =====
const range = document.getElementById('calc-range');
const yen = n => '¥' + n.toLocaleString('ja-JP');

function calc() {
  const n = Number(range.value);
  const plans = [
    { name: '都度払い', total: n * 5500, note: '回数が少ないうちは、都度払いがお得です。' },
    { name: n > 4 ? `月4回 + 追加${n - 4}回` : '月4回', total: 17600 + Math.max(0, n - 4) * 4400,
      note: n < 4 ? `あと${4 - n}回分あまるので、もう少し通えます。` : n > 4 ? '追加は会員価格 1回 ¥4,400 で受けられます。' : '週1回のペースにぴったりです。' },
    { name: n > 8 ? `月8回 + 追加${n - 8}回` : '月8回', total: 28600 + Math.max(0, n - 8) * 3575,
      note: n < 8 ? `あと${8 - n}回分あまるので、もう少し通えます。` : n > 8 ? '追加は会員価格 1回 ¥3,575 で受けられます。' : '週2回のペースにぴったりです。' },
    { name: '通い放題', total: 35200, note: 'これ以上は何回通っても同じ料金です。' },
  ];
  const best = plans.reduce((a, b) => (b.total < a.total ? b : a));
  document.getElementById('calc-n').textContent = n;
  document.getElementById('calc-plan').textContent = best.name;
  document.getElementById('calc-total').textContent = yen(best.total);
  document.getElementById('calc-per').textContent = yen(Math.round(best.total / n));
  document.getElementById('calc-note').textContent = best.note;
}
range.addEventListener('input', calc);
calc();

// ===== 体験予約フォーム =====
const form = document.getElementById('trial-form');
const fields = document.getElementById('form-fields');
const confirmBox = document.getElementById('form-confirm');
const doneBox = document.getElementById('trial-done');
const dateInput = document.getElementById('f-date');
const slotSelect = document.getElementById('f-slot');
const errorBox = document.getElementById('form-error');

const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = s => new Date(s + 'T00:00');
dateInput.min = toISO(now);
dateInput.max = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30));

function updateSlots(selected = '') {
  slotSelect.innerHTML = '';
  if (!dateInput.value) {
    slotSelect.add(new Option('先に日付を選んでください', ''));
    return;
  }
  const date = fromISO(dateInput.value);
  slotSelect.add(new Option('選んでください', ''));
  lessonsOf(date).forEach(([time, cls, who]) => {
    const full = spotsLeft(date, time, cls) === 0;
    const past = isPast(date, time);
    const value = `${time} ${cls}`;
    const opt = new Option(`${time} ${cls}(${who})${full ? ' 満席' : past ? ' 終了' : ''}`, value, false, value === selected);
    opt.disabled = full || past;
    slotSelect.add(opt);
  });
}
dateInput.addEventListener('change', () => updateSlots());

// スケジュールの「この枠で予約」から来たとき
function pickSlot(date, time, cls) {
  dateInput.value = toISO(date);
  updateSlots(`${time} ${cls}`);
  dateInput.classList.remove('is-error');
  slotSelect.classList.remove('is-error');
  document.getElementById('trial').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('f-name').focus({ preventScroll: true }), 600);
}

form.querySelectorAll('input, select, textarea').forEach(el => {
  el.addEventListener('input', () => el.classList.remove('is-error'));
});

function dateText() {
  const d = fromISO(dateInput.value);
  return `${d.getMonth() + 1}月${d.getDate()}日(${DOW_JA[d.getDay()]}) ${slotSelect.value}`;
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
  const data = new FormData(form);
  const rows = [
    ['お名前', data.get('name')],
    ['電話番号', data.get('tel')],
    ['日時・クラス', dateText()],
    ['ピラティスの経験', data.get('exp')],
    ['気になるところ', data.get('note') || '—'],
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
  [`${data.get('name')} 様`, dateText(), 'レッスンの15分前にお越しください。', 'ウェアやタオルは手ぶらで大丈夫です。'].forEach((line, i) => {
    if (i) text.append(document.createElement('br'));
    text.append(line);
  });
  form.hidden = true;
  doneBox.hidden = false;
  doneBox.scrollIntoView({ block: 'center' });
});

// ===== スクロールで表示 & 下のボタン =====
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  });
}, { threshold: .15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const spBtn = document.querySelector('.sp-btn');
// ヒーローと予約フォームが見えている間はかくす
const seen = new Set();
new IntersectionObserver(entries => {
  entries.forEach(en => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
  spBtn.classList.toggle('is-hidden', seen.size > 0);
}, { threshold: .1 }).observe(document.querySelector('.hero__text'));
new IntersectionObserver(([en]) => {
  en.isIntersecting ? seen.add(en.target) : seen.delete(en.target);
  spBtn.classList.toggle('is-hidden', seen.size > 0);
}, { threshold: .1 }).observe(document.getElementById('trial'));
