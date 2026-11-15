import {products,categories,colorNames,filterProducts,plural,readStored,writeStored,cleanRequest,inquiryMessage,productOrderMessage,parseRoute} from './model.js';
import {icon,hydrateIcons} from './icons.js';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photo=p=>`assets/product-${p.id}.jpg`;
const source=p=>`https://t.me/StoreForYouForever/${p.id}?single`;
const telegramLink=text=>`https://t.me/fede4ek?text=${encodeURIComponent(text)}`;
const storedFavorites=readStored('sfyf-selection',[]);
const favorites=new Set(Array.isArray(storedFavorites)?storedFavorites.filter(id=>products.some(p=>p.id===id)):[]);
let request=cleanRequest(readStored('sfyf-request',[]));
let note=String(readStored('sfyf-note','')).slice(0,300);
const filters={category:'all',query:'',colors:[],sort:'recent'};
let pageSize=12,layout=readStored('sfyf-layout','grid')==='list'?'list':'grid',currentView='catalog',currentProduct=null,baseHash='#catalog',routeReady=false;
let toastTimer;
const scrollPositions=new Map(),detailDrafts=new Map();
const whitePhotos=new Set([1099,1107,1109,1114,1118]);
const categoryPreview={all:null,new:1118,outerwear:1109,hoodies:1111,pants:1103,shoes:1117};
const categorySubtitles={all:'Одежда и кроссовки',new:'10 вещей · 27 октября',outerwear:'Пуховики, парки, стёганые',hoodies:'С принтом и на молнии',pants:'Джинсы и свободные брюки',shoes:'Низкие и высокие модели'};
const folderNames={all:'Все',new:'Новинки',outerwear:'Куртки',hoodies:'Худи',pants:'Брюки',shoes:'Обувь'};
function saveRequest(){writeStored('sfyf-request',request);writeStored('sfyf-note',note);updateCounts();}
function updateCounts(){
 $$('.favorites-count').forEach(el=>{el.textContent=favorites.size;el.hidden=!favorites.size;});
 $$('.request-count').forEach(el=>{el.textContent=request.length;el.hidden=!request.length;});
}
function renderNavigation(){
 const order=['all','new','outerwear','hoodies','pants','shoes'];
 $('#category-list').innerHTML=order.map(key=>{const count=filterProducts({category:key}).length;return `<a class="chat-row" href="#catalog/${key}" data-route="#catalog/${key}" data-nav-category="${key}"><span class="chat-avatar">${categoryPreview[key]?`<img src="assets/product-${categoryPreview[key]}.jpg" alt="">`:icon('grid')}</span><span class="chat-copy"><b>${categories[key]}</b><small>${categorySubtitles[key]}</small></span><span class="count">${count}</span></a>`;}).join('');
 $('#folder-tabs').innerHTML=order.map(key=>`<button class="folder-tab" data-category="${key}" aria-label="${folderNames[key]}: ${plural(filterProducts({category:key}).length)}" aria-pressed="false">${folderNames[key]}</button>`).join('');
}
function favoriteButton(p){const saved=favorites.has(p.id);return `<button class="save-product ${saved?'saved':''}" data-favorite="${p.id}" aria-label="${saved?'Убрать из избранного':'В избранное'}: ${escapeHtml(p.name)}" aria-pressed="${saved}">${icon('heart')}</button>`;}
function card(p){const size=detailDrafts.get(p.id)??request.find(item=>item.id===p.id)?.size??'';return `<article class="product-card"><div class="product-image-wrap"><a class="product-open ${whitePhotos.has(p.id)?'white-photo':''}" href="#product/${p.id}" data-product="${p.id}" aria-label="Открыть: ${escapeHtml(p.name)}"><img src="${photo(p)}" alt="${escapeHtml(p.name)}, ${escapeHtml(p.color)}" loading="lazy" width="800" height="900"></a>${favoriteButton(p)}${p.date==='2026-10-27'?'<span class="new-label">27 октября</span>':''}</div><div class="card-body"><p class="card-category">${categories[p.category]}</p><a class="card-title" href="#product/${p.id}" data-product="${p.id}">${p.name}</a><p class="card-color">${p.color}</p><div class="card-bottom"><span class="card-price">Цена по запросу</span><a class="quick-order" href="${telegramLink(productOrderMessage(p,size))}" aria-label="Заказать: ${escapeHtml(p.name)}" rel="noopener">Заказать${icon('external')}</a></div></div></article>`;}

function emptyState(kind){const content={search:['search','Ничего не нашлось','Попробуй другое название или убери фильтры.','Сбросить поиск'],favorites:['heart','Здесь будет избранное','Нажми на сердечко рядом с вещью, чтобы сохранить её.','Перейти в каталог'],request:['bag','Сначала выбери вещи','Добавляй вещи в заявку. Потом можно указать размеры и обсудить всё одним сообщением.','Перейти в каталог']}[kind];return `<div class="empty-state"><span class="empty-icon">${icon(content[0])}</span><h2>${content[1]}</h2><p>${content[2]}</p>${kind==='search'?`<button class="button secondary" data-reset-search>${content[3]}</button>`:`<a class="button primary" href="#catalog" data-route="#catalog">${content[3]}</a>`}</div>`;}
function renderProducts(){
 const matches=filterProducts(filters);
 $('#product-grid').innerHTML=matches.slice(0,pageSize).map(card).join('')||emptyState('search');
 $('#catalog-title').innerHTML=escapeHtml(categories[filters.category])+`<span class="title-count">${matches.length}</span>`;
 $('#catalog-summary').textContent=matches.length>pageSize?`${pageSize} из ${plural(matches.length)}`:plural(matches.length);
 $('#show-more').hidden=pageSize>=matches.length;
 $('#clear-search').hidden=!filters.query;
 $('#filter-count').textContent=filters.colors.length;$('#filter-count').hidden=!filters.colors.length;
 $('#active-filters').hidden=!filters.colors.length;
 $('#active-filters').innerHTML=filters.colors.map(c=>`<button class="filter-chip" data-remove-color="${c}">${colorNames[c]}${icon('close')}</button>`).join('');
 applyLayout();updateNavigation();
}
function applyLayout(){
 $$('.product-grid').forEach(el=>el.classList.toggle('list',layout==='list'));
 $$('[data-layout]').forEach(el=>{const active=el.dataset.layout===layout;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
}
function updateNavigation(){
 $$('[data-nav-category]').forEach(el=>{const active=currentView==='catalog'&&el.dataset.navCategory===filters.category;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $$('.folder-tab').forEach(el=>{const active=el.dataset.category===filters.category;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
 $$('[data-route]').filter(el=>!el.hasAttribute('data-nav-category')).forEach(el=>{const active=parseRoute(el.dataset.route).view===currentView;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $('#header-subtitle').textContent={catalog:'Одежда и кроссовки · 20 вещей',favorites:'Избранное',request:'Заявка продавцу',store:'Информация о магазине'}[currentView];
}
function renderFavorites(){const items=products.filter(p=>favorites.has(p.id));$('#favorites-content').innerHTML=items.length?`<div class="favorite-summary"><span>${plural(items.length)}</span><a class="text-button" href="#request" data-route="#request">Моя заявка ${icon('arrow')}</a></div><div class="product-grid">${filterProducts({sort:'recent'},items).map(card).join('')}</div>`:emptyState('favorites');applyLayout();}
function requestItem(item){const p=products.find(p=>p.id===item.id);return `<article class="request-item"><a href="#product/${p.id}" data-product="${p.id}" aria-label="Открыть ${escapeHtml(p.name)}"><img src="${photo(p)}" alt="${escapeHtml(p.name)}"></a><div><h2>${p.name}</h2><p class="item-color">${p.color}</p></div><button class="icon-button" data-remove-request="${p.id}" aria-label="Убрать ${escapeHtml(p.name)} из заявки">${icon('close')}</button><div class="request-item-controls"><label class="size-field">Нужный размер<input data-request-size="${p.id}" maxlength="40" value="${escapeHtml(item.size)}" placeholder="${p.category==='shoes'?'Например, 42':'Например, M'}" aria-label="Нужный размер: ${escapeHtml(p.name)}"></label><div class="stepper"><button data-qty="${p.id}" data-change="-1" ${item.qty<=1?'disabled':''} aria-label="Уменьшить количество: ${escapeHtml(p.name)}">${icon('minus')}</button><span aria-label="Количество: ${item.qty}">${item.qty}</span><button data-qty="${p.id}" data-change="1" ${item.qty>=9?'disabled':''} aria-label="Увеличить количество: ${escapeHtml(p.name)}">${icon('plus')}</button></div></div></article>`;}
function renderRequest(){
 $('#request-content').innerHTML=request.length?`<div class="request-layout"><div class="request-list">${request.map(requestItem).join('')}</div><aside class="request-summary"><h2>${plural(request.length)} в заявке</h2><p>Размер можно оставить пустым. Продавец подскажет цену и доступные варианты.</p><label for="request-note">Комментарий</label><textarea id="request-note" maxlength="300" placeholder="Например: нужны замеры куртки">${escapeHtml(note)}</textarea><a id="request-telegram" class="button primary" href="${telegramLink(inquiryMessage(request,note))}" rel="noopener">Заказать ${icon('external')}</a><button class="button secondary" data-copy-request>Скопировать заявку ${icon('copy')}</button><p class="request-disclaimer">Стоимость и наличие подтвердит продавец.</p></aside></div>`:emptyState('request');
}
function updateRequestLink(){const link=$('#request-telegram');if(link)link.href=telegramLink(inquiryMessage(request,note));}
function refreshCards(){renderProducts();if(currentView==='favorites')renderFavorites();}
function addToRequest(id,size){
 const existing=request.find(item=>item.id===id);
 if(existing){if(size!==undefined){existing.size=size;saveRequest();}navigate('#request');return;}
 request.push({id,size:String(size||'').slice(0,40),qty:1});saveRequest();refreshCards();updateDetailActions();toast('Добавлено в заявку');
}
function removeFromRequest(id){request=request.filter(item=>item.id!==id);saveRequest();renderRequest();refreshCards();updateDetailActions();toast('Убрано из заявки');}
function toggleFavorite(id){
 if(favorites.has(id))favorites.delete(id);else favorites.add(id);
 writeStored('sfyf-selection',[...favorites]);updateCounts();
 $$(`[data-favorite="${id}"]`).forEach(button=>{const saved=favorites.has(id);button.classList.toggle('saved',saved);button.setAttribute('aria-pressed',String(saved));const p=products.find(p=>p.id===id);button.setAttribute('aria-label',`${saved?'Убрать из избранного':'В избранное'}: ${p.name}`);});
 if(currentView==='favorites')renderFavorites();updateDetailActions();toast(favorites.has(id)?'Сохранено в избранном':'Убрано из избранного');
}
function singleMessage(p){return productOrderMessage(p,$('#detail-size')?.value.trim()||'');}
function showProduct(id){
 const p=products.find(p=>p.id===id);if(!p)return;
 currentProduct=id;const stored=request.find(item=>item.id===id);const size=detailDrafts.has(id)?detailDrafts.get(id):(stored?.size||'');
 $('#product-detail').innerHTML=`<div class="detail-grid"><button class="detail-photo" id="zoom-product" aria-label="Увеличить фотографию"><img src="${photo(p)}" alt="${escapeHtml(p.name)}"><span class="zoom-indicator">${icon('zoom')}</span></button><div class="detail-copy"><p class="detail-category">${categories[p.category]} · ${p.date==='2026-10-27'?'27':'16'} октября</p><h2 id="detail-title">${p.name}</h2><p class="detail-color">${p.color}</p><p class="detail-description">${p.description}</p><dl class="detail-info"><div><dt>Цена</dt><dd>По запросу</dd></div><div><dt>Наличие</dt><dd>Уточняет продавец</dd></div></dl><label class="detail-size" for="detail-size">Какой размер нужен?<input id="detail-size" maxlength="40" placeholder="${p.category==='shoes'?'Например, 42':'Например, M или нужны замеры'}" value="${escapeHtml(size)}"><small>Можно пропустить. Доступные размеры подскажет продавец.</small></label><div class="detail-actions"><a id="single-telegram" class="button primary" href="#" rel="noopener">Заказать ${icon('external')}</a><div class="detail-secondary"><button id="detail-add" class="button secondary">${icon('plus')}В заявку</button><button class="detail-favorite" data-detail-favorite="${id}" aria-label="В избранное" aria-pressed="false">${icon('heart')}</button></div></div><a class="detail-source" href="${source(p)}" target="_blank" rel="noopener">Оригинальная публикация ${icon('external')}</a></div></div>`;
 $('#single-telegram').href=telegramLink(singleMessage(p));updateDetailActions();
 if(!$('#product-dialog').open)openDialog('product-dialog');
}
function updateDetailActions(){
 if(!currentProduct)return;
 const added=request.some(item=>item.id===currentProduct),saved=favorites.has(currentProduct);
 const add=$('#detail-add');if(add)add.innerHTML=icon(added?'check':'plus')+(added?'Открыть заявку':'В заявку');
 const favorite=$('[data-detail-favorite]');if(favorite){favorite.classList.toggle('saved',saved);favorite.setAttribute('aria-label',saved?'Убрать из избранного':'В избранное');favorite.setAttribute('aria-pressed',String(saved));}
}
function openDialog(id){$('#'+id).showModal();document.body.style.overflow='hidden';}
function closePlainDialog(id){const d=$('#'+id);if(d.open)d.close();if(!$('dialog[open]'))document.body.style.overflow='';}
function closeProduct(){if($('#photo-dialog').open)closePlainDialog('photo-dialog');if(history.state?.productOverlay){history.back();}else navigate('#catalog',true);}
function openProduct(id){if(!products.some(p=>p.id===id))return;scrollPositions.set(baseHash,window.scrollY);history.pushState({productOverlay:true},'','#product/'+id);applyRoute();}
function navigate(hash,replace=false){
 if(currentView!=='product')scrollPositions.set(baseHash,window.scrollY);
 closePlainDialog('filter-dialog');
 if(location.hash!==hash){if(replace)history.replaceState(null,'',hash);else history.pushState(null,'',hash);}
 applyRoute();
}
function applyRoute(){
 const route=parseRoute(location.hash);
 if(route.view==='product'){if(!routeReady){currentView='catalog';showView('catalog');renderProducts();routeReady=true;}showProduct(route.id);return;}
 if($('#photo-dialog').open)closePlainDialog('photo-dialog');closePlainDialog('product-dialog');currentProduct=null;
 const previousCategory=filters.category;
 currentView=route.view;if(route.view==='catalog'&&route.category)filters.category=route.category;
 if(previousCategory!==filters.category)pageSize=12;
 baseHash=location.hash||'#catalog';showView(currentView);renderProducts();
 if(currentView==='favorites')renderFavorites();if(currentView==='request')renderRequest();updateNavigation();
 const position=scrollPositions.get(baseHash)||0;requestAnimationFrame(()=>window.scrollTo({top:position,behavior:'instant'}));routeReady=true;
}
function showView(view){$$('.view').forEach(section=>{section.hidden=section.id!==view+'-view';});}
function resetSearch(){filters.query='';filters.colors=[];$('#search').value='';pageSize=12;renderProducts();}
function openFilters(){
 const palette={black:'#24272d',grey:'#92969e',white:'#fff',blue:'#4487c7',pink:'#d68ab1',red:'#d95761'};
 $('#color-filters').innerHTML=Object.entries(colorNames).map(([key,label])=>`<label class="color-row"><span class="color-dot" style="background:${palette[key]}"></span><span>${label}</span><span>${filterProducts({...filters,colors:[key]}).length}</span><input type="checkbox" name="color" value="${key}" ${filters.colors.includes(key)?'checked':''}></label>`).join('');updateFilterPreview();openDialog('filter-dialog');
}
function draftColors(){return $$('#filter-form input:checked').map(input=>input.value);}
function updateFilterPreview(){const count=filterProducts({...filters,colors:draftColors()}).length;$('#apply-filters').textContent='Показать '+plural(count);}
async function copyText(text,success){try{await navigator.clipboard.writeText(text);toast(success);}catch{toast('Не удалось скопировать. Можно открыть Telegram.');}}
function toast(text){const t=$('#toast');t.textContent=text;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2500);}
function resizeHeader(){document.documentElement.style.setProperty('--viewport-height',window.innerHeight+'px');}
// Delegation keeps cards and request controls working after updates.
document.addEventListener('click',event=>{
 const target=event.target.closest('[data-route],[data-category],[data-product],[data-favorite],[data-add],[data-detail-favorite],[data-remove-request],[data-qty],[data-close],[data-layout],[data-remove-color],[data-reset-search],[data-copy-request],[data-copy-address]');if(!target)return;
 if(target.dataset.product){event.preventDefault();openProduct(Number(target.dataset.product));}
 else if(target.dataset.route){event.preventDefault();navigate(target.dataset.route);}
 else if(target.dataset.category){event.preventDefault();navigate('#catalog/'+target.dataset.category);}
 else if(target.dataset.favorite)toggleFavorite(Number(target.dataset.favorite));
 else if(target.dataset.detailFavorite)toggleFavorite(Number(target.dataset.detailFavorite));
 else if(target.dataset.add)addToRequest(Number(target.dataset.add));
 else if(target.dataset.removeRequest)removeFromRequest(Number(target.dataset.removeRequest));
 else if(target.dataset.qty){const id=Number(target.dataset.qty),change=Number(target.dataset.change),item=request.find(item=>item.id===id);if(item){item.qty=Math.max(1,Math.min(9,item.qty+change));saveRequest();renderRequest();$(`[data-qty="${id}"][data-change="${change}"]`)?.focus({preventScroll:true});}}
 else if(target.dataset.close){if(target.dataset.close==='product-dialog')closeProduct();else closePlainDialog(target.dataset.close);}
 else if(target.dataset.layout){layout=target.dataset.layout;writeStored('sfyf-layout',layout);applyLayout();}
 else if(target.dataset.removeColor){filters.colors=filters.colors.filter(c=>c!==target.dataset.removeColor);pageSize=12;renderProducts();}
 else if(target.hasAttribute('data-reset-search'))resetSearch();
 else if(target.hasAttribute('data-copy-request'))copyText(inquiryMessage(request,note),'Заявка скопирована');
 else if(target.hasAttribute('data-copy-address'))copyText('Центральный рынок, проспект Металлургов, 64','Адрес скопирован');
});
document.addEventListener('input',event=>{
 const target=event.target;
 if(target.id==='search'){filters.query=target.value;pageSize=12;renderProducts();}
 else if(target.id==='detail-size'&&currentProduct){detailDrafts.set(currentProduct,target.value);const p=products.find(p=>p.id===currentProduct);$('#single-telegram').href=telegramLink(singleMessage(p));}
 else if(target.dataset.requestSize){const item=request.find(item=>item.id===Number(target.dataset.requestSize));if(item){item.size=target.value.slice(0,40);saveRequest();updateRequestLink();}}
 else if(target.id==='request-note'){note=target.value.slice(0,300);saveRequest();updateRequestLink();}
});
$('#clear-search').addEventListener('click',()=>{filters.query='';$('#search').value='';pageSize=12;renderProducts();$('#search').focus();});
$('#show-more').addEventListener('click',()=>{pageSize+=12;renderProducts();});
$('#sort').addEventListener('change',event=>{filters.sort=event.target.value;renderProducts();});
$('#focus-search').addEventListener('click',()=>{if(currentView!=='catalog'||currentProduct)navigate('#catalog');$('#search').focus({preventScroll:true});$('#search').scrollIntoView({block:'center',behavior:'smooth'});});
$('#open-filters').addEventListener('click',openFilters);
$('#filter-form').addEventListener('change',updateFilterPreview);
$('#filter-form').addEventListener('submit',event=>{event.preventDefault();filters.colors=draftColors();pageSize=12;closePlainDialog('filter-dialog');renderProducts();});
$('#reset-filters').addEventListener('click',()=>{$$('#filter-form input').forEach(input=>{input.checked=false;});updateFilterPreview();});
$('#close-product').addEventListener('click',closeProduct);
$('#share-product').addEventListener('click',()=>copyText(location.origin+location.pathname+'#product/'+currentProduct,'Ссылка на вещь скопирована'));
$('#product-detail').addEventListener('click',event=>{
 if(event.target.closest('#detail-add')&&currentProduct)addToRequest(currentProduct,$('#detail-size').value.trim());
 if(event.target.closest('#zoom-product')&&currentProduct){const p=products.find(p=>p.id===currentProduct);$('#zoom-photo').src=photo(p);$('#zoom-photo').alt=p.name;openDialog('photo-dialog');}
});
$$('dialog').forEach(dialog=>{
 dialog.addEventListener('close',()=>{if(!$('dialog[open]'))document.body.style.overflow='';});
 dialog.addEventListener('cancel',event=>{if(dialog.id==='product-dialog'){event.preventDefault();closeProduct();}});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){if(dialog.id==='product-dialog')closeProduct();else closePlainDialog(dialog.id);}}});
});
window.addEventListener('popstate',applyRoute);
window.addEventListener('resize',resizeHeader);
hydrateIcons();renderNavigation();updateCounts();applyRoute();resizeHeader();
