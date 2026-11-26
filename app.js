'use strict';
const showcase = document.body.dataset?.access === 'showcase';
const premium = !['showcase', 'standard'].includes(document.body.dataset?.access);
const preview = document.body.dataset?.preview === 'tariffs';
const datasetPath = preview ? document.body.dataset.access + '/' : '';
const $ = id => document.getElementById(id);
const state = {places: [], lockedPlaces: [], visible: [], selected: null, similar: null, focus: 'all', matches: new Map(), map: null, pins: null, markers: new Map(), here: null, sortedAt: null, watch: null, follow: false, location: null};
// «Хочу» и «Был» live only in this browser: {placeId: 'want' | 'been'}.
const MARKS_KEY = preview ? 'bali-preview-marks' : 'bali-marks';
const marks = (() => {try {if (showcase) return {}; return JSON.parse(localStorage.getItem(MARKS_KEY)) || {};} catch {return {};}})();
const escaped = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label = (p, field) => english ? translations.places[p.id][field] : p[field];
const fold = value => String(value).toLocaleLowerCase('ru').replace(/ё/g, 'е');
// Compare facts in each place's category/description/tip; names and photos are not evidence.
const dining = p => /Кофе|Рестораны|Бич-клубы|Пекарни|Бары|Бургеры/.test(p.category);
function diningFormat(p) {
  // Primary format is an eligibility rule, not another bonus for incidental menu words.
  if (/Бич-клубы/.test(p.category)) return 'beachclub';
  if (/Бары/.test(p.category)) return 'bar';
  if (/Бургеры/.test(p.category)) return 'fastfood';
  if (/Кофе|Пекарни/.test(p.category)) return 'cafe';
  const description = fold(p.description || '');
  if (/кафе/.test(description) && /завтрак|бранч/.test(description) && !/ресторан|бистро/.test(description)) return 'cafe';
  return 'restaurant';
}
const similarityTraits = {
  cuisine: [
    ['Итальянская кухня', /итальян/], ['Японская кухня', /японск[^.：:]{0,16}(?:кухн|идзака)|суши|сашими|рамен|гюкацу/],
    ['Индонезийская кухня', /индонезийск|балийск.{0,12}кухн|наси|баби гулинг/], ['Греческая кухня', /греческ/],
    ['Французская кухня', /французск/], ['Средиземноморская кухня', /средиземномор/], ['Грузинская кухня', /грузинск|хинкали|хачапури/],
    ['Русская кухня', /русск.{0,12}кухн|солянк|вареник/], ['Испанская кухня', /испанск|паэль/],
    ['Мексиканская кухня', /мексиканск/], ['Азиатская кухня', /азиатск|юго.восточн.{0,12}ази/], ['Европейская кухня', /европейск.{0,12}кухн/],
    ['Морепродукты', /морепродукт|кревет|устриц|осьминог/], ['Пицца и паста', /пицц|паст[ауые]|фокачч/],
    ['Гриль и стейки', /грил|стейк|барбекю|дровян|на дровах|на огне|живом огне/], ['Бургеры', /бургер/],
    ['Веганское меню', /веган/], ['Выпечка и десерты', /выпечк|круассан|пекарн|десерт|торт/]
  ],
  atmosphere: [
    ['Сад и зелень', /в саду|с садом|садом|водным сад|оранжере|зеленью|зелен.{0,12}террас/],
    ['У океана', /на пляже|на берегу|у пляжа|над океаном|вид.{0,16}(?:океан|море)|столик.{0,12}на песке/],
    ['На скале', /на скале|со скалы|на краю скалы|над обрывом/], ['В пещере', /пещер|грот/],
    ['Вид на поля', /вид.{0,16}(?:поля|террас)|у полей|рисов.{0,12}(?:пол|террас)/],
    ['Европейский интерьер', /европейск.{0,12}(?:интерьер|атмосфер)/],
    ['Ваби-саби', /ваби.саби/], ['Винтаж', /винтаж|антиквар/], ['Уютная атмосфера', /уютн/],
    ['Романтическая атмосфера', /романтич|свидани/], ['Живая музыка', /жив.{0,6}музык/], ['Вечеринки и диджеи', /вечеринк|дидже|клуб с музык/]
  ],
  format: [
    ['Завтраки и бранчи', /завтрак|бранч/], ['Кофе', /кофе|кофейн/], ['Вино', /вин[аоуы]|винный|винная/],
    ['Коктейли', /коктейл/], ['На компанию', /на компани|с друзьями|на стол|совместн/],
    ['С детьми', /детск|для семьи/], ['На закат', /закат/], ['Дегустационный ужин', /дегустацион|шеф.{0,8}(?:стол|меню)|chef.s counter/],
    ['Бассейн и лежаки', /бассейн|лежаки/]
  ]
};
function traits(p) {
  const text = fold([p.description || '', p.recommendation || ''].join(' '));
  return Object.fromEntries(Object.entries(similarityTraits).map(([group, rules]) => [group, rules.filter(([, re]) => re.test(text)).map(([label]) => label)]));
}
function similarPlaces(source, candidates, focus = 'all') {
  if (!dining(source)) return [];
  const base = traits(source), format = diningFormat(source);
  return candidates.filter(p => p.id !== source.id && dining(p) && diningFormat(p) === format).map(p => {
    const other = traits(p), reasons = [];
    let score = 0;
    for (const group of Object.keys(similarityTraits)) {
      if (focus !== 'all' && focus !== group) continue;
      const shared = base[group].filter(label => other[group].includes(label));
      shared.forEach(label => reasons.push(label));
      // Normalize each dimension so a long description cannot dominate by tag count.
      if (shared.length) score += (group === 'cuisine' ? 3 : 2) * shared.length / new Set([...base[group], ...other[group]]).size;
    }
    return {place: p, reasons, score};
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score || Number(b.place.area === source.area) - Number(a.place.area === source.area) || a.place.id.localeCompare(b.place.id));
}
const similarButton = p => premium && dining(p) ? `<button class="similar-button" type="button" data-similar="${escaped(p.id)}">${t('Найти похожее')}</button>` : '';
const similarityReason = p => state.similar && state.matches.has(p.id) ? `<p class="similar-reasons">${t('Общее: ')}${state.matches.get(p.id).reasons.map(reason => escaped(t(reason))).join(' · ')}</p>` : '';
function chooseSimilar(id) {
  const source = state.places.find(p => p.id === id);
  if (!premium || !source || !dining(source)) return;
  state.similar = id;
  state.focus = 'all';
  for (const id of ['search', 'area', 'category', 'mark', 'sort']) $(id).value = '';
  $('filter-drawer').open = false;
  render(); view(false);
  document.querySelector('.sidebar').scrollTop = 0;
  document.querySelector('[data-focus="all"]').focus();
}
function clearSimilar() {
  state.similar = null;
  state.focus = 'all';
  render();
  document.querySelector('.sidebar').scrollTop = 0;
}
// «1 место», «3 места», «25 мест».
const places = n => english ? n + (n === 1 ? ' place' : ' places') : n + ' ' + (n % 10 === 1 && n % 100 !== 11 ? 'место' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'места' : 'мест');
const safeLink = value => {try {const u = new URL(value); return u.protocol === 'https:' ? u.href : null;} catch {return null;}};
function links(p, popup = false) {
  let html = '';
  if (safeLink(p.mapUrl)) html += `<a href="${escaped(p.mapUrl)}" target="_blank" rel="noopener noreferrer">Google Maps</a>`;
  if (p.lat !== null && p.lng !== null) html += `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener noreferrer">${t('Маршрут')}</a>`;
  const sources = !premium ? [] : (popup ? (p.sourceUrls || []).slice(0, 1) : (p.sourceUrls || []));
  sources.forEach((url, i) => {if (safeLink(url)) html += `<a href="${escaped(url)}" target="_blank" rel="noopener noreferrer">Instagram${sources.length > 1 ? ' ' + (i + 1) : ''}</a>`;});
  return html;
}
// Google's range is a reported spend per person, separate from menu prices and tips.
const menuBasket = {cafe: 'кофе + завтрак', restaurant: 'салат + основное + алкогольный напиток', bar: '3 коктейля + закуска'};
const menuCharges = {excluded: 'без налогов и сбора', included: 'налоги и сбор включены', unspecified: 'налоги и сбор не указаны'};
function priceInfo(p) {
  if (!premium) return '';
  if (p.googlePriceRange && safeLink(p.googlePriceSourceUrl)) return `<p class="text price">${escaped(p.googlePriceRange)} ${t('на человека')} · <a href="${escaped(p.googlePriceSourceUrl)}" target="_blank" rel="noopener noreferrer">Google Maps</a></p>`;
  const m = p.menuPriceEstimate;
  if (!m || !safeLink(m.sourceUrl)) return '';
  const amount = n => n.toLocaleString('en-US');
  return `<p class="text price">${t('Оценка по меню')}: ≈ Rp ${amount(m.min)}–${amount(m.max)} ${t('на человека')} · ${t(menuBasket[m.basket])} · ${t(menuCharges[m.charges])} · <a href="${escaped(m.sourceUrl)}" target="_blank" rel="noopener noreferrer">${t('Официальное меню')}</a></p>`;
}
// Shared body text of a card and a map popup.
const details = p => `<p class="text">${escaped(label(p, 'description'))}</p>${priceInfo(p)}${p.recommendation ? `<p class="text tip">${escaped(label(p, 'recommendation'))}</p>` : ''}${p.note ? `<p class="text note">${escaped(label(p, 'note'))}</p>` : ''}`;
// Straight-line distance in km; Google's drive times on Bali run low, so no travel time is shown.
function km([lat1, lng1], [lat2, lng2]) {
  const r = Math.PI / 180, a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lng2 - lng1) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
const distance = d => d < 1 ? Math.round(d * 100) * 10 + (english ? ' m' : ' м') : d.toLocaleString(english ? 'en-GB' : 'ru-RU', {maximumFractionDigits: d < 10 ? 1 : 0}) + (english ? ' km' : ' км');
// Category without its leading emoji, area and, once the location is known, distance: «Рестораны · Убуд и окрестности · 3,2 км».
const meta = p => `<p class="meta">${escaped(label(p, 'category').replace(/^\S+\s+/, ''))} · ${escaped(label(p, 'area'))}${state.here && p.lat !== null ? ' · ' + distance(km(state.here, [p.lat, p.lng])) : ''}</p>`;
const markButtons = p => showcase ? '' : `<div class="marks">${[['want', 'Хочу'], ['been', 'Был']].map(([mark, label]) => `<button type="button" data-mark="${mark}" data-id="${p.id}" aria-pressed="${marks[p.id] === mark}">${t(label)}</button>`).join('')}</div>`;
const pinIcon = p => L.divIcon({className: 'emoji-pin' + (!showcase && marks[p.id] ? ' ' + marks[p.id] : ''), html: escaped(p.emoji), iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]});
function popup(p) {
  return `${p.image ? `<img class="popup-img" src="${escaped(p.image)}" alt="${escaped(label(p, 'name'))}">` : ''}<h2>${escaped(label(p, 'name'))}</h2>${meta(p)}${details(p)}${similarityReason(p)}<div class="links">${links(p, true)}</div>${markButtons(p)}${similarButton(p)}`;
}
function card(p) {
  const photo = p.image ? `<img class="card-photo" src="${escaped(p.image)}" alt="${escaped(label(p, 'name'))}" loading="lazy" decoding="async">` : `<div class="card-photo card-placeholder" aria-hidden="true">${escaped(p.emoji)}</div>`;
  return `<article class="card${p.id === state.selected ? ' selected' : ''}" id="place-${p.id}" data-id="${p.id}"><div class="card-top">${photo}<div class="card-heading"><h2 class="place-name"><button class="place-button" data-place="${p.id}" type="button">${escaped(label(p, 'name'))}</button></h2>${meta(p)}${details(p)}${similarityReason(p)}<div class="links">${links(p)}</div>${markButtons(p)}${similarButton(p)}</div></div></article>`;
}
function fit() {
  const coords = state.visible.filter(p => p.lat !== null).map(p => [p.lat, p.lng]);
  if (state.map && coords.length) state.map.fitBounds(coords, {padding: [55, 55], maxZoom: 14});
}
function view(mapMode, fitPlaces = true) {
  document.body.classList.toggle('map-mode', mapMode);
  $('map-view').classList.toggle('active', mapMode);
  $('list-view').classList.toggle('active', !mapMode);
  $('map-view').setAttribute('aria-pressed', String(mapMode));
  $('list-view').setAttribute('aria-pressed', String(!mapMode));
  if (mapMode && state.map) requestAnimationFrame(() => {state.map.invalidateSize(); if (fitPlaces && !state.follow) fit();});
}
function locationStatus(message) {
  $('location-status').hidden = !message;
  $('location-status').textContent = message;
}
function stopLocation() {
  if (state.watch !== null) navigator.geolocation.clearWatch(state.watch);
  state.watch = null; state.follow = false;
  state.location?.remove(); state.location = null;
  $('locate').classList.remove('is-located');
  $('locate').removeAttribute('aria-busy');
}
// One position watch serves both the blue dot and the «Ближе ко мне» order.
function watchLocation() {
  if (state.watch !== null) return true;
  if (!window.isSecureContext || !navigator.geolocation) {locationStatus(t('Браузер не даёт определить местоположение.')); return false;}
  $('locate').setAttribute('aria-busy', 'true');
  state.watch = navigator.geolocation.watchPosition(found, lost, {enableHighAccuracy: true, maximumAge: 10000, timeout: 15000});
  return true;
}
function found({coords}) {
  state.here = [coords.latitude, coords.longitude];
  if (state.map) {
    if (!state.location) state.location = L.circleMarker(state.here, {radius: 9, color: '#fff', weight: 3, fillColor: '#2475db', fillOpacity: 1, interactive: false, className: 'user-location'}).addTo(state.map);
    else state.location.setLatLng(state.here);
    if (state.follow) {state.follow = false; state.map.setView(state.here, 16, {animate: false});}
  }
  $('locate').classList.add('is-located');
  $('locate').removeAttribute('aria-busy');
  locationStatus('');
  // Re-sort only after a real move, not on every GPS jitter.
  if (!state.sortedAt || km(state.sortedAt, state.here) > 0.2) {state.sortedAt = state.here; renderList();}
}
function lost(error) {
  stopLocation();
  const message = error.code === 1 ? t('Доступ к местоположению выключен в настройках браузера.') : t('Не удалось определить местоположение.');
  locationStatus(message);
  if ($('sort').value) {$('sort').value = ''; renderList(); $('count').textContent = message;}
}
function locate() {
  locationStatus('');
  if (state.location) {state.map.setView(state.location.getLatLng(), 16, {animate: false}); return;}
  state.follow = true;
  watchLocation();
}
function select(id, fromMap = false) {
  const p = state.visible.find(place => place.id === id);
  if (!p) return;
  state.selected = id;
  document.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
  const element = $('place-' + id);
  if (element) element.classList.add('selected');
  const url = new URL(location.href); url.searchParams.set('place', id); history.replaceState(null, '', url);
  if (fromMap) {if (matchMedia('(min-width:761px)').matches) element?.scrollIntoView({block: 'nearest'}); return;}
  if (p.lat === null) return;
  // Revealing the map must not start a competing fitBounds animation over this selection.
  if (matchMedia('(max-width:760px)').matches) view(true, false);
  const marker = state.markers.get(id);
  if (state.map && marker) requestAnimationFrame(() => {state.map.setView([p.lat, p.lng], 15, {animate: false}); state.pins.zoomToShowLayer(marker, () => marker.openPopup());});
}
function setMark(id, mark) {
  if (showcase) return;
  if (marks[id] === mark) delete marks[id]; else marks[id] = mark;
  try {localStorage.setItem(MARKS_KEY, JSON.stringify(marks));} catch {}
  document.querySelectorAll(`[data-mark][data-id="${id}"]`).forEach(b => b.setAttribute('aria-pressed', String(marks[id] === b.dataset.mark)));
  const p = state.places.find(place => place.id === id);
  if (p) state.markers.get(id)?.setIcon(pinIcon(p));
  if ($('mark').value) render();
}
function renderList() {
  const shown = !state.similar && $('sort').value && state.here
    ? [...state.visible].sort((a, b) => (a.lat === null) - (b.lat === null) || (a.lat !== null && km(state.here, [a.lat, a.lng]) - km(state.here, [b.lat, b.lng])))
    : state.visible;
  const pins = state.visible.filter(p => p.lat !== null).length;
  $('count').textContent = !state.similar && $('sort').value && !state.here ? t('Определяю местоположение…') : places(state.visible.length) + (pins < state.visible.length ? `, ${pins} ${t('на карте')}` : '');
  $('cards').innerHTML = shown.length ? shown.map(card).join('') : `<div class="empty"><strong>${t('Ничего не нашлось')}</strong>${state.similar ? t('Совпадений по описаниям нет. Выберите другой признак или сбросьте фильтры.') : $('mark').value ? t('Отметок пока нет: нажмите «Хочу» или «Был» в карточке.') : t('Измените запрос или сбросьте фильтры.')}</div>`;
}
function render() {
  const words = fold($('search').value).trim().split(/\s+/).filter(Boolean);
  const area = $('area').value, category = $('category').value, mark = $('mark').value;
  const source = state.places.find(p => p.id === state.similar);
  $('similar-panel').hidden = !source;
  $('similar-close').hidden = !source;
  $('similar-name').textContent = source ? label(source, 'name') : '';
  document.querySelectorAll('[data-focus]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.focus === state.focus)));
  $('sort-option').hidden = Boolean(source);
  const activeFilters = ['area', 'category', 'mark'].map(id => $(id)).filter(input => input.value);
  $('filter-label').textContent = activeFilters.length ? t('Фильтры') + ' (' + activeFilters.length + ')' : t('Фильтры');
  $('sort').disabled = Boolean(source);
  const matches = source ? similarPlaces(source, state.places, state.focus) : [];
  state.matches = new Map(matches.map(match => [match.place.id, match]));
  const candidates = source ? matches.map(match => match.place) : state.places;
  state.visible = candidates.filter(p => (!area || p.area === area) && (!category || p.category === category) && (!mark || marks[p.id] === mark) && words.every(word => fold([p.name, p.description, p.recommendation, p.area, p.category, ...['name', 'description', 'recommendation', 'area', 'category'].map(field => label(p, field))].join(' ')).includes(word)));
  renderList();
  if (state.map) {
    state.pins.clearLayers(); state.markers.clear();
    state.visible.filter(p => p.lat !== null).forEach(p => {
      // Popup content is built on open, so it shows the current marks and distance.
      const marker = L.marker([p.lat, p.lng], {icon: pinIcon(p), title: label(p, 'name'), alt: label(p, 'name')}).bindPopup(layer => {
        // Size against the map on every open, including clients with older cached CSS.
        // Auto-pan must leave the anchor on screen or markercluster removes it and closes the popup.
        layer.getPopup().options.maxHeight = Math.max(80, state.map.getSize().y - 100);
        return popup(p);
      }, {maxWidth: 310});
      marker.on('click', () => select(p.id, true)); state.markers.set(p.id, marker);
    });
    state.pins.addLayers([...state.markers.values()]);
    fit();
  }
  const url = new URL(location.href);
  for (const [key, value] of [['area', area], ['type', category], ['mark', mark], ['q', $('search').value], ['similar', state.similar || ''], ['focus', state.similar && state.focus !== 'all' ? state.focus : '']]) {if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);}
  if (!state.visible.some(p => p.id === state.selected)) {state.selected = null; url.searchParams.delete('place');}
  history.replaceState(null, '', url);
}
async function start() {
  const response = await fetch(datasetPath + 'places.json', {cache: 'no-cache'});
  if (!response.ok) throw new Error(t('Не удалось загрузить подборку'));
  const data = await response.json(); state.places = data.places;
  state.lockedPlaces = showcase ? data.lockedPlaces || [] : [];
  if (showcase) {
    $('mark').closest('label').hidden = true;
    $('showcase-status').textContent = t('Открыто ') + places(state.places.length) + t(' · Серые точки — места в платной карте. Поиск и фильтры работают по открытым карточкам.');
  }
  if (english) {const response = await fetch(datasetPath + 'places.en.json', {cache: 'no-cache'}); if (!response.ok) throw new Error('Could not load English translations'); translations = await response.json();}
  $('updated').textContent = t('Обновлено ') + new Date(data.updated + 'T12:00:00').toLocaleDateString(english ? 'en-GB' : 'ru-RU');
  for (const [id, field] of [['area', 'area'], ['category', 'category']]) {
    [...new Set(state.places.map(p => p[field]))].forEach(value => {const opt = new Option(label(state.places.find(p => p[field] === value), field), value); $(id).add(opt);});
  }
  const params = new URLSearchParams(location.search); const savedPlace = params.get('place');
  $('search').value = params.get('q') || '';
  for (const [id, key] of [['area', 'area'], ['category', 'type'], ['mark', 'mark']]) {if (showcase && id === 'mark') continue; if ([...$(id).options].some(o => o.value === params.get(key))) $(id).value = params.get(key);}
  if (typeof L !== 'undefined') {
    state.map = L.map('map', {zoomControl: false, scrollWheelZoom: true}).setView([-8.52, 115.18], 10);
    L.control.zoom({position: 'topright', zoomInTitle: t('Приблизить'), zoomOutTitle: t('Отдалить')}).addTo(state.map);
    // crossOrigin lets the offline copy (sw.js) save tiles as normal images.
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, crossOrigin: true, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(state.map);
    // Calibrate against the whole Ubud area, rather than a fixed zoom number:
    // the same geographic view has different zooms on phones and wide screens.
    const districtZoom = () => state.map.getBoundsZoom([[-8.58, 115.21], [-8.43, 115.31]]);
    state.pins = L.markerClusterGroup({maxClusterRadius: 45, disableClusteringAtZoom: districtZoom() || 12, showCoverageOnHover: false, chunkedLoading: true,
      iconCreateFunction: c => L.divIcon({className: 'pin-cluster', html: c.getChildCount(), iconSize: [36, 36]})}).addTo(state.map);
    state.map.on('resize', () => {
      const size = state.map.getSize(), zoom = districtZoom();
      if (!size.x || !size.y || zoom === state.pins.options.disableClusteringAtZoom) return;
      const opened = [...state.markers.values()].find(marker => marker.isPopupOpen());
      state.pins.options.disableClusteringAtZoom = zoom;
      // clearLayers rebuilds markercluster's zoom grids with the new threshold.
      state.pins.clearLayers();
      state.pins.addLayers([...state.markers.values()]);
      if (opened && state.map.getZoom() >= zoom) opened.openPopup();
    });
    // Closed points have no names, IDs, popups or filterable attributes.
    L.layerGroup(state.lockedPlaces.map(p => L.circleMarker([p.lat, p.lng], {radius: 4, color: '#777', weight: 1, fillColor: '#999', fillOpacity: 0.65, interactive: false}))).addTo(state.map);
    let tileErrors = 0;
    tiles.on('tileerror', () => {if (++tileErrors >= 3) {$('map-status').hidden = false; $('map-status').textContent = t('Подложка карты не загрузилась. Места есть в списке.');}});
    tiles.on('load', () => {if (!tileErrors) $('map-status').hidden = true;});
    new ResizeObserver(() => state.map.invalidateSize()).observe($('map-panel'));
  } else {$('map-status').hidden = false; $('map-status').textContent = t('Карта недоступна. Места есть в списке.');}
  const similar = premium && state.places.find(p => p.id === params.get('similar') && dining(p));
  state.similar = similar?.id || null;
  state.focus = ['all', ...Object.keys(similarityTraits)].includes(params.get('focus')) ? params.get('focus') : 'all';
  render(); if (savedPlace) select(savedPlace);
}
$('search').addEventListener('input', clearSimilar);
$('area').addEventListener('change', render); $('category').addEventListener('change', render); $('mark').addEventListener('change', render);
$('sort').addEventListener('change', () => {if ($('sort').value && !watchLocation()) $('sort').value = ''; renderList(); document.querySelector('.sidebar').scrollTop = 0;});
$('reset').addEventListener('click', () => {$('filter-drawer').open = false;state.similar = null; state.focus = 'all'; $('search').value = ''; $('area').value = ''; $('category').value = ''; $('mark').value = ''; render();});
$('cards').addEventListener('click', event => {const button = event.target.closest('[data-place]'); if (button) select(button.dataset.place);});
$('similar-focus').addEventListener('click', event => {
  const button = event.target.closest('[data-focus]');
  if (button) {state.focus = button.dataset.focus; render();}
});
$('filters-done').addEventListener('click', () => {$('filter-drawer').open = false; document.querySelector('.sidebar').scrollTop = 0; $('filter-drawer').querySelector('summary').focus();});
$('similar-close').addEventListener('click', () => {clearSimilar(); $('search').focus();});
document.addEventListener('click', event => {const button = event.target.closest('[data-similar]'); if (button) chooseSimilar(button.dataset.similar);});
// Mark buttons sit in cards and in map popups.
document.addEventListener('click', event => {const button = event.target.closest('[data-mark]'); if (button) setMark(button.dataset.id, button.dataset.mark);});
$('map-view').addEventListener('click', () => view(true)); $('list-view').addEventListener('click', () => view(false));
$('locate').addEventListener('click', locate);
addEventListener('pagehide', stopLocation);
if ('serviceWorker' in navigator && (!showcase || preview)) navigator.serviceWorker.register('sw.js').catch(() => {});
start().catch(error => {$('count').textContent = t('Ошибка загрузки'); $('cards').innerHTML = `<div class="empty"><strong>${escaped(error.message)}</strong>${!premium ? t('Обновите страницу.') : `${t('Обновите страницу или откройте')} <a href="${preview ? '../' : ''}downloads/Bali-places${english ? '-en' : ''}.html">${t('подборку')}</a>.`}</div>`;});
