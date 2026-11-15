export const iconPaths={
 grid:'<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1.5"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1.5"/><rect x="14" y="14" width="6.5" height="6.5" rx="1.5"/>',
 heart:'<path d="M20.5 5.5a5.2 5.2 0 0 0-7.4 0L12 6.6l-1.1-1.1a5.2 5.2 0 0 0-7.4 7.4L12 21l8.5-8.1a5.2 5.2 0 0 0 0-7.4Z"/>',
 bag:'<path d="M5 7.5h14l1 13H4l1-13Z"/><path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
 down:'<path d="M12 5v14m-6-6 6 6 6-6"/>',
 message:'<path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.3c-1.3 0-2.7-.3-3.8-.8L3 20.5l1.5-4.8a8 8 0 0 1-1-4.2A8.4 8.4 0 0 1 12 3.2a8.4 8.4 0 0 1 8.5 8.3Z"/><path d="M8 11.5h8"/>',
 telegram:'<path d="m3 10 17-6-3 16-6-5-3 3 .5-6L18 6 7 11l-4-1Z"/>',
 external:'<path d="M8 5h11v11M19 5 5 19"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/>',
 copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
 check:'<path d="m5 12 4.5 4.5L19 7"/>'
};
export function icon(name){return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||''}</svg>`;}
export function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.icon);});}

Object.assign(iconPaths,{
sliders:'<path d="M4 7h10m4 0h2M4 17h2m4 0h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
list:'<path d="M9 5h11M9 12h11M9 19h11M4 5h.1M4 12h.1M4 19h.1"/>',
back:'<path d="m15 5-7 7 7 7"/>',
share:'<path d="M8 8H5v13h14V8h-3M12 15V3m-4 4 4-4 4 4"/>',
location:iconPaths.pin,
pin:'<path d="m8 3 8 0-1 6 3 4H6l3-4-1-6ZM12 13v8"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
minus:'<path d="M5 12h14"/>',
zoom:'<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5M7 10h6m-3-3v6"/>'
});
