'use strict';
// A review sandbox, never an access check. Real paid access needs the planned server.
const previewParams = new URLSearchParams(location.search);
const previewTier = ['showcase', 'standard', 'premium'].includes(previewParams.get('tier')) ? previewParams.get('tier') : 'premium';
const previewEnglish = previewParams.get('lang') === 'en';
document.body.dataset.access = previewTier;
document.body.dataset.preview = 'tariffs';
const previewText = (ru, en) => previewEnglish ? en : ru;
const previewPanel = document.createElement('section');
previewPanel.className = 'tariff-preview';
previewPanel.setAttribute('aria-label', previewText('Тест тарифов', 'Test plans'));
const previewHeading = document.createElement('strong');
previewHeading.textContent = previewText('Тестовая версия тарифов', 'Plan preview');
previewPanel.append(previewHeading);
const previewNotice = document.createElement('p');
previewNotice.textContent = previewText('Демо без оплаты и защиты доступа. Отметки отдельные от основной карты.', 'Demo without payment or access protection. Marks are separate from the main map.');
previewPanel.append(previewNotice);
const previewModes = document.createElement('nav');
previewModes.setAttribute('aria-label', previewText('Выбор тарифа', 'Choose a plan'));
for (const [tier, ru, en] of [['showcase', 'Витрина', 'Free'], ['standard', 'Обычный', 'Standard'], ['premium', 'Премиум', 'Premium']]) {
  const link = document.createElement('a');
  const url = new URL(location.href);
  url.searchParams.set('tier', tier);
  // Keep search/area and language; tier-specific selections must not hide the next mode.
  for (const key of ['mark', 'similar', 'focus', 'place']) url.searchParams.delete(key);
  link.href = url;
  link.textContent = previewText(ru, en);
  if (tier === previewTier) link.setAttribute('aria-current', 'page');
  previewModes.append(link);
}
previewPanel.append(previewModes);
const previewFeatures = document.createElement('p');
previewFeatures.textContent = previewTier === 'showcase'
  ? previewText('15 карточек и серые точки остальных мест. Поиск, фильтры, расстояние и маршрут.', '15 open cards and grey dots for other places. Search, filters, distance and directions.')
  : previewTier === 'standard'
    ? previewText('Все места, поиск, фильтры, маршрут, расстояние, «Хочу» и «Был», офлайн.', 'All places, search, filters, directions, distance, Want to go and Been, offline.')
    : previewText('Всё из обычного + диапазоны цен, «Найти похожее», исходные рилсы, HTML, PDF и KML.', 'Everything in Standard + price ranges, similar places, original reels, HTML, PDF and KML.');
previewPanel.append(previewFeatures);
document.querySelector('.sidebar').prepend(previewPanel);
if (previewTier === 'showcase') {
  const status = document.createElement('p');
  status.id = 'showcase-status';
  status.className = 'showcase-status';
  status.setAttribute('role', 'status');
  previewPanel.after(status);
}
if (previewTier !== 'premium') {
  for (const link of document.querySelectorAll('a[href*="downloads/"]')) link.remove();
}
