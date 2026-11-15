import {products} from './products.js';
export {products};
export const categories={all:'Все вещи',new:'Поступление 27.10',outerwear:'Куртки',hoodies:'Худи и олимпийки',pants:'Брюки',shoes:'Кроссовки и кеды'};
export const colorNames={black:'Чёрный',grey:'Серый и графит',white:'Белый',blue:'Синий',pink:'Розовый',red:'Красный'};
export const normalize=text=>String(text).toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const synonyms={кроссы:'кроссов',кроссовки:'кроссов',куртка:'куртк',куртки:'куртк',джинсы:'джинс',черный:'черн',черные:'черн',белые:'бел',белый:'бел',серый:'сер',серые:'сер',синие:'син',синий:'син'};
export function plural(n,forms=['вещь','вещи','вещей']){const k=n%10,t=n%100;return `${n} ${k===1&&t!==11?forms[0]:k>=2&&k<=4&&(t<12||t>14)?forms[1]:forms[2]}`;}
export function filterProducts({category='all',query='',colors=[],sort='recent'}={},items=products){
 const terms=normalize(query).split(' ').filter(Boolean).map(t=>synonyms[t]||t);
 const result=items.filter(p=>{
  const categoryMatch=category==='all'||(category==='new'?p.date==='2026-10-27':p.category===category);
  const text=normalize(`${p.name} ${p.color} ${p.description} ${categories[p.category]}`);
  return categoryMatch&&(!colors.length||colors.some(color=>p.colors.includes(color)))&&terms.every(t=>text.includes(t));
 });
 return result.sort(sort==='name'?(a,b)=>a.name.localeCompare(b.name,'ru'):(a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
}
export function readStored(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value??fallback;}catch{return fallback;}}
export function writeStored(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function cleanRequest(value){if(!Array.isArray(value))return[];const seen=new Set();return value.filter(v=>v&&products.some(p=>p.id===Number(v.id))&&!seen.has(Number(v.id))&&seen.add(Number(v.id))).map(v=>({id:Number(v.id),size:String(v.size||'').replace(/[\n\r]/g,' ').slice(0,40),qty:Math.max(1,Math.min(9,Math.round(Number(v.qty)||1)))}));}
export function inquiryMessage(request,note=''){
 const rows=cleanRequest(request).map((item,i)=>{const p=products.find(p=>p.id===item.id);return `${i+1}. ${p.name}${item.size?' · размер '+item.size:''}${item.qty>1?' · '+item.qty+' шт.':''}\nhttps://t.me/StoreForYouForever/${p.id}?single`;});
 return `Здравствуйте! Хочу заказать:\n\n${rows.join('\n\n')}${note.trim()?'\n\nКомментарий: '+note.trim().slice(0,300):''}`;
}
export function parseRoute(hash){const parts=hash.replace(/^#\/?/,'').split('/');if(parts[0]==='product'){const id=Number(parts[1]);if(products.some(p=>p.id===id))return{view:'product',id};}if(['catalog','favorites','request','store'].includes(parts[0]))return{view:parts[0],category:parts[1] in categories?parts[1]:undefined};return{view:'catalog'};}

export function productOrderMessage(product,size=''){
 return `Здравствуйте! Хочу заказать:\n${product.name}\nЦвет: ${product.color}${String(size).trim()?'\nРазмер: '+String(size).trim().replace(/[\r\n]/g,' ').slice(0,40):''}\n\nФото: https://t.me/StoreForYouForever/${product.id}?single\n\nПодскажите стоимость и наличие.`;
}
