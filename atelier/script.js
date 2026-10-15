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

// ===== スクロールでふわっと表示 =====
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ===== 申し込みエリアが見えている間は、下のボタンをかくす =====
const spBtn = document.querySelector('.sp-btn');
const seen = new Set();
const hideIo = new IntersectionObserver(entries => {
  entries.forEach(en => (en.isIntersecting ? seen.add(en.target) : seen.delete(en.target)));
  spBtn.classList.toggle('is-hidden', seen.size > 0);
}, { threshold: .1 });
['free', 'contact'].forEach(id => hideIo.observe(document.getElementById(id)));
hideIo.observe(document.querySelector('.hero__btns'));
