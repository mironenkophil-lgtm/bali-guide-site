'use strict';
// Locale stays in the URL; saved marks and canonical filter values are shared.
const english = new URLSearchParams(location.search).get('lang') === 'en';
let translations = {places: {}};
const messages = {
  "Бесплатная витрина": "Free preview",
  "Открыто ": "Open: ",
  " · Серые точки — места в платной карте. Поиск и фильтры работают по открытым карточкам.": " · Grey dots are places on the paid map. Search and filters apply to open cards.",
  "Обновите страницу.": "Reload the page.",
  "Бали": "Bali",
  "Бали — места из рилсов": "Bali — places from reels",
  "Места на Бали из сохранённых рилсов: карта, фото и маршруты.": "Places in Bali from saved reels: map, photos and directions.",
  "Подборка и загрузки": "Guide and downloads",
  "Подборка": "Guide",
  "Поиск и места": "Search and places",
  "Фильтры мест": "Place filters",
  "Поиск": "Search",
  "Поиск по названию и описанию": "Search names and descriptions",
  "Сбросить похожие": "Clear similar places",
  "Фильтры": "Filters",
  "Загрузка…": "Loading…",
  "Район": "Area",
  "Все районы": "All areas",
  "Категория": "Category",
  "Все категории": "All categories",
  "Отметки": "Saved places",
  "Все отметки": "All places",
  "Хочу сходить": "Want to go",
  "Уже был": "Visited",
  "Порядок": "Sort by",
  "По районам": "By area",
  "Ближе ко мне": "Nearest to me",
  "Сбросить всё": "Reset all",
  "Показать места": "Show places",
  "Подбор похожих мест": "Find similar places",
  "Похожие на «": "Similar to “",
  "»": "”",
  "По каким признакам искать похожее": "Choose what to match",
  "Всё": "All",
  "Кухня": "Cuisine",
  "Атмосфера": "Atmosphere",
  "Формат": "Occasion",
  "Сначала тот же формат заведения, затем кухня и атмосфера": "Same type of venue first, then cuisine and atmosphere",
  "Найденные места": "Matching places",
  "Карта мест Бали": "Map of Bali places",
  "Моё местоположение": "My location",
  "Режим просмотра": "View mode",
  "Список": "List",
  "Карта": "Map",
  "Для карты нужен JavaScript.": "JavaScript is required for the map.",
  "Открыть подборку с фото": "Open the illustrated guide",
  "Найти похожее": "Find similar",
  "Общее: ": "In common: ",
  "Маршрут": "Directions",
  "Забронировать": "Reserve",
  "Открыто сейчас": "Open now",
  "Сегодня": "Today",
  "Часы на неделю": "Weekly hours",
  "Нет данных": "Hours unavailable",
  "Круглосуточно": "Open 24 hours",
  "Открыто": "Open",
  "Закрыто": "Closed",
  "Открыто до ": "Open until ",
  "Закрыто, откроется в ": "Closed, opens at ",
  "Закрыто, откроется завтра в ": "Closed, opens tomorrow at ",
  "Понедельник": "Monday",
  "Вторник": "Tuesday",
  "Среда": "Wednesday",
  "Четверг": "Thursday",
  "Пятница": "Friday",
  "Суббота": "Saturday",
  "Воскресенье": "Sunday",
  "на человека": "per person",
  "Оценка по меню": "Menu estimate",
  "Официальное меню": "Official menu",
  "кофе + завтрак": "coffee + breakfast",
  "салат + основное + алкогольный напиток": "salad + main + alcoholic drink",
  "3 коктейля + закуска": "3 cocktails + snack",
  "без налогов и сбора": "before tax and service",
  "налоги и сбор включены": "tax and service included",
  "налоги и сбор не указаны": "tax and service unspecified",
  "Хочу": "Want to go",
  "Был": "Visited",
  "Обновлено ": "Updated ",
  "на карте": "on the map",
  "Ничего не нашлось": "No places found",
  "Браузер не даёт определить местоположение.": "Your browser cannot determine your location.",
  "Доступ к местоположению выключен в настройках браузера.": "Location access is disabled in your browser settings.",
  "Не удалось определить местоположение.": "Could not determine your location.",
  "Определяю местоположение…": "Finding your location…",
  "Совпадений по описаниям нет. Выберите другой признак или сбросьте фильтры.": "No matching descriptions. Try another trait or reset the filters.",
  "Отметок пока нет: нажмите «Хочу» или «Был» в карточке.": "No saved places yet. Select “Want to go” or “Visited” on a card.",
  "Измените запрос или сбросьте фильтры.": "Change your search or reset the filters.",
  "Не удалось загрузить подборку": "Could not load places",
  "Подложка карты не загрузилась. Места есть в списке.": "Map tiles could not load. Places are available in the list.",
  "Карта недоступна. Места есть в списке.": "The map is unavailable. Places are available in the list.",
  "Ошибка загрузки": "Loading error",
  "Обновите страницу или откройте": "Refresh this page or open the",
  "подборку": "guide",
  "Приблизить": "Zoom in",
  "Отдалить": "Zoom out",
  "Итальянская кухня": "Italian cuisine",
  "Японская кухня": "Japanese cuisine",
  "Индонезийская кухня": "Indonesian cuisine",
  "Греческая кухня": "Greek cuisine",
  "Французская кухня": "French cuisine",
  "Средиземноморская кухня": "Mediterranean cuisine",
  "Грузинская кухня": "Georgian cuisine",
  "Русская кухня": "Russian cuisine",
  "Испанская кухня": "Spanish cuisine",
  "Мексиканская кухня": "Mexican cuisine",
  "Азиатская кухня": "Asian cuisine",
  "Европейская кухня": "European cuisine",
  "Морепродукты": "Seafood",
  "Пицца и паста": "Pizza and pasta",
  "Гриль и стейки": "Grill and steaks",
  "Бургеры": "Burgers",
  "Веганское меню": "Vegan menu",
  "Выпечка и десерты": "Pastries and desserts",
  "Сад и зелень": "Gardens and greenery",
  "У океана": "Oceanfront",
  "На скале": "Clifftop",
  "В пещере": "In a cave",
  "Вид на поля": "Rice field views",
  "Европейский интерьер": "European interiors",
  "Ваби-саби": "Wabi-sabi",
  "Винтаж": "Vintage",
  "Уютная атмосфера": "Cosy atmosphere",
  "Романтическая атмосфера": "Romantic atmosphere",
  "Живая музыка": "Live music",
  "Вечеринки и диджеи": "Parties and DJs",
  "Завтраки и бранчи": "Breakfast and brunch",
  "Кофе": "Coffee",
  "Вино": "Wine",
  "Коктейли": "Cocktails",
  "На компанию": "For groups",
  "С детьми": "With children",
  "На закат": "Sunset",
  "Дегустационный ужин": "Tasting menu",
  "Бассейн и лежаки": "Pool and sun loungers"
};
const t = value => english ? (messages[value] ?? value) : value;
if (english) {
  document.documentElement.lang = 'en';
  document.title = t(document.title);
  const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node; (node = nodes.nextNode());) {
    const text = node.textContent.trim();
    if (messages[text]) node.textContent = node.textContent.replace(text, messages[text]);
  }
  for (const element of document.querySelectorAll('[aria-label], [title], [placeholder], meta[name="description"]')) {
    for (const attribute of ['aria-label', 'title', 'placeholder', 'content']) {
      if (element.hasAttribute(attribute)) element.setAttribute(attribute, t(element.getAttribute(attribute)));
    }
  }
  for (const link of document.querySelectorAll('a[href*="downloads/"]')) link.href = link.getAttribute('href').replace(/(\.html|\.pdf|\.kml)$/, '-en$1');
  document.querySelector('h1 a').href = '?lang=en';
}
const languageURL = new URL(location.href);
if (english) languageURL.searchParams.delete('lang'); else languageURL.searchParams.set('lang', 'en');
const languageLink = document.getElementById('language');
languageLink.href = languageURL;
languageLink.textContent = english ? 'RU' : 'EN';
languageLink.hreflang = english ? 'ru' : 'en';
languageLink.lang = english ? 'ru' : 'en';
languageLink.setAttribute('aria-label', english ? 'Switch to Russian' : 'Switch to English');
// Build the destination at click time so newly changed filters survive switching.
languageLink.addEventListener('click', event => {
  event.preventDefault();
  const url = new URL(location.href);
  if (english) url.searchParams.delete('lang'); else url.searchParams.set('lang', 'en');
  location.href = url;
});
