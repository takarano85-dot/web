// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Contact form: builds a mailto link (no backend configured yet)
const CONTACT_EMAIL = 'your-email@example.com';

const contactForm = document.getElementById('contact-form');
const formNote = document.getElementById('form-note');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = contactForm.name.value.trim();
    const contact = contactForm.contact.value.trim();
    const menu = contactForm.menu.value;
    const message = contactForm.message.value.trim();

    if (!name || !contact) {
      formNote.textContent = 'お名前とご連絡先は必須です。';
      return;
    }

    const subject = `【お問い合わせ】${name}様より（${menu}）`;
    const bodyLines = [
      `お名前: ${name}`,
      `ご連絡先: ${contact}`,
      `ご希望のプラン: ${menu}`,
      '',
      'ご相談内容:',
      message || '(未入力)',
    ];
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    window.location.href = mailto;
    formNote.textContent = 'メールソフトが開きます。内容をご確認のうえ送信してください。';
  });
}
