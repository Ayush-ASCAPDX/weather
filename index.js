
     const API_KEY = "f2118be75c6f9ef1666ebc726fca3970"; // ← replace with your OpenWeatherMap API key
const loader = document.getElementById("loader");
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const suggestionsEl = document.getElementById('suggestions');
const messageEl = document.getElementById('message');
const cityNameEl = document.getElementById('cityName');
const descEl = document.getElementById('desc');
const tempEl = document.getElementById('temp');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const feelsEl = document.getElementById('feels');
const iconImg = document.getElementById('iconImg');
const forecastEl = document.getElementById('forecast');
const lastUpdatedEl = document.getElementById('lastUpdated');
const recentListEl = document.getElementById('recentList');
const removeAllBtn = document.getElementById('removeAll');
const clearRecentBtn = document.getElementById('clearRecent');
const themeBtn = document.getElementById('themeBtn');
let suggestTimer = null;
let lastQuery = '';
const SUGGEST_MIN = 3;
const RECENT_KEY = 'weather_app_recent_v1';
const THEME_KEY = 'weather_app_theme_v1';
const effectContainer = document.querySelector(".weather-effect");

function createRain() {
  effectContainer.innerHTML = "";
  for (let i = 0; i < 80; i++) {
    let drop = document.createElement("div");
    drop.className = "rain-drop";
    drop.style.left = Math.random() * window.innerWidth + "px";
    drop.style.animationDuration = (0.5 + Math.random() * 0.7) + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    effectContainer.appendChild(drop);
  }
}

function createSnow() {
  effectContainer.innerHTML = "";
  for (let i = 0; i < 50; i++) {
    let flake = document.createElement("div");
    flake.className = "snow-flake";
    flake.style.left = Math.random() * window.innerWidth + "px";
    flake.style.animationDuration = (3 + Math.random() * 3) + "s";
    flake.style.animationDelay = Math.random() * 5 + "s";
    effectContainer.appendChild(flake);
  }
}

function clearEffect() {
  effectContainer.innerHTML = "";
}



function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}


// Initialize with New York default
(function init(){
  loadTheme();
  renderRecent();
  fetchWeatherByCoords(40.7128, -74.0060, 'New York, US'); // default New York
})();

// THEME

// THEME
function loadTheme(){ 
 const themeBtn = document.getElementById('themeBtn');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem(THEME_KEY, document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}
}

// RECENT SEARCHES
function getRecent(){ try { return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]'); } catch(e){ return []; } }
function addRecent(obj){ if(!obj||!obj.name) return; let list=getRecent(); const key=`${obj.name}|${obj.lat}|${obj.lon}`; list=list.filter(it=>`${it.name}|${it.lat}|${it.lon}`!==key); list.unshift(obj); if(list.length>8) list=list.slice(0,8); localStorage.setItem(RECENT_KEY,JSON.stringify(list)); renderRecent(); }
function renderRecent(){ const list=getRecent(); recentListEl.innerHTML=''; if(list.length===0){ recentListEl.innerHTML='<div style="opacity:0.85">No recent searches</div>'; return; } list.forEach(it=>{ const div=document.createElement('div'); div.className='recent-item'; div.innerHTML=`<div style="font-weight:700">${it.name}</div><div style="opacity:0.9">${it.country||''}</div>`; div.addEventListener('click',()=>fetchWeatherByCoords(it.lat,it.lon,it.name)); recentListEl.appendChild(div); }); }
removeAllBtn.addEventListener('click',()=>{ localStorage.removeItem(RECENT_KEY); renderRecent(); });
clearRecentBtn.addEventListener('click',()=>{ removeAllBtn.click(); });

// SUGGESTIONS
cityInput.addEventListener('input', (e)=>{ const q=e.target.value.trim(); if(q.length<SUGGEST_MIN){ suggestionsEl.style.display='none'; return; } if(suggestTimer) clearTimeout(suggestTimer); suggestTimer=setTimeout(()=>doSuggest(q),350); });
cityInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ searchBtn.click(); suggestionsEl.style.display='none'; }});
document.addEventListener('click', (e)=>{ if(!e.target.closest('.suggestions')) suggestionsEl.style.display='none'; });
async function doSuggest(q){ if(!API_KEY||API_KEY==='YOUR_API_KEY'){ showMessage('Set your API key first.',true); return; } if(q===lastQuery) return; lastQuery=q; try{ const url=`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=6&appid=${API_KEY}`; const res=await fetch(url); const list=await res.json(); if(!Array.isArray(list)||list.length===0){ suggestionsEl.style.display='none'; return; } suggestionsEl.innerHTML=''; list.forEach(item=>{ const name=item.name+(item.state?', '+item.state:'')+(item.country?', '+item.country:''); const el=document.createElement('div'); el.className='suggest-item'; el.textContent=name; el.addEventListener('click',()=>{ cityInput.value=item.name+(item.state?', '+item.state:''); suggestionsEl.style.display='none'; fetchWeatherByCoords(item.lat,item.lon,item.name+(item.state?', '+item.state:'')+(item.country?', '+item.country:'')); }); suggestionsEl.appendChild(el); }); suggestionsEl.style.display='block'; }catch(err){ console.error(err); suggestionsEl.style.display='none'; } }

// SEARCH BUTTON
searchBtn.addEventListener('click', async()=>{ const q=cityInput.value.trim(); if(!q){ showMessage('Enter city name.',true); return; } try{ showLoader();showMessage('Searching...'); const geo=await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`).then(r=>r.json()); if(!geo||geo.length===0){ showMessage('City not found.',true);hideLoader(); return; } const item=geo[0]; const niceName=item.name+(item.state?', '+item.state:'')+(item.country?', '+item.country:''); fetchWeatherByCoords(item.lat,item.lon,niceName); }catch(err){ console.error(err); showMessage('Error searching city',true); } finally {hideLoader();} });

// GEOLOCATION
locBtn.addEventListener('click',()=>{ if(!navigator.geolocation){ showMessage('Geolocation not supported.',true); return; } showMessage('Getting location...'); navigator.geolocation.getCurrentPosition(async(pos)=>{ const lat=pos.coords.latitude; const lon=pos.coords.longitude; const url=`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`; try{ const res=await fetch(url); const arr=await res.json(); const name=(arr&&arr[0]&&(arr[0].name+(arr[0].country?', '+arr[0].country:'')))||'Your location'; fetchWeatherByCoords(lat,lon,name); }catch(err){ console.error(err); fetchWeatherByCoords(lat,lon,'Your location'); }}, (err)=>{ console.error(err); showMessage('Unable to get location: '+err.message,true); }); });

// FETCH weather by coords
async function fetchWeatherByCoords(lat,lon,displayName){ 
  try{ 
    showLoader();   // 🔹 Show loader here
    showMessage('Loading weather...'); 
    
    const curUrl=`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`; 
    const curRes=await fetch(curUrl); 
    if(!curRes.ok) throw new Error('Failed to fetch current weather'); 
    const cur=await curRes.json(); 

    const fUrl=`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`; 
    const fRes=await fetch(fUrl); 
    if(!fRes.ok) throw new Error('Failed to fetch forecast'); 
    const fdata=await fRes.json(); 

    renderCurrent(cur,displayName||cur.name); 
    renderForecast(fdata); 
    addRecent({name:displayName||cur.name,lat,lon,country:(cur.sys&&cur.sys.country)||''}); 
    showMessage('',false); 
  }catch(err){ 
    console.error(err); 
    showMessage('Error fetching weather: '+err.message,true); 
  } finally {
    hideLoader();
  }
}
function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

fetch(apiURL)
  .then(res => res.json())
  .then(data => {
    renderWeather(data);
    hideLoader();   // यहाँ loader हटेगा
  })
  .catch(err => {
    console.error(err);
    hideLoader();   // error पर भी हटे
  });


// RENDER current
function setWeatherTheme(weatherMain) {
  document.body.classList.remove("sunny","cloudy","rainy","snowy","thunder","mist");
  if(!weatherMain) return;
  weatherMain = weatherMain.toLowerCase();
  if(weatherMain.includes("clear")) document.body.classList.add("sunny");
  else if(weatherMain.includes("cloud")) document.body.classList.add("cloudy");
  else if(weatherMain.includes("rain")) document.body.classList.add("rainy");
  else if(weatherMain.includes("snow")) document.body.classList.add("snowy");
  else if(weatherMain.includes("thunder")) document.body.classList.add("thunder");
  else if(weatherMain.includes("mist")||weatherMain.includes("fog")||weatherMain.includes("haze")) 
    document.body.classList.add("mist");
}


function renderCurrent(data, displayName) {
  cityNameEl.textContent = displayName || data.name;
  descEl.textContent = (data.weather && data.weather[0] && data.weather[0].description) || '';
  tempEl.textContent = Math.round(data.main.temp) + '°C';
  humidityEl.textContent = 'Humidity: ' + data.main.humidity + '%';
  windEl.textContent = 'Wind: ' + (data.wind.speed || 0) + ' m/s';
  feelsEl.textContent = 'Feels: ' + Math.round(data.main.feels_like) + '°C';

  const icon = data.weather && data.weather[0] && data.weather[0].icon;
  if(icon){
    iconImg.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    iconImg.alt = data.weather[0].description || '';
  }

  lastUpdatedEl.textContent = 'Updated: ' + new Date().toLocaleString();

  // 👉 Weather theme apply
  function setWeatherTheme(weatherMain) {
    document.body.classList.remove("sunny","cloudy","rainy","snowy","thunder","mist");
    clearEffect(); // पहले effects clear कर दो

    if(!weatherMain) return;
    weatherMain = weatherMain.toLowerCase();

    let imgUrl = ""; // background image
    if (weatherMain.includes("clear")) {
    imgUrl = "https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    themeClass = "theme-clear";
  } else if (weatherMain.includes("cloud")) {
    imgUrl = "https://images.unsplash.com/photo-1743614491407-c0af2955dcf8?q=80&w=1074&auto=format&fit=crop";
    themeClass = "theme-cloud";
  } else if (weatherMain.includes("rain")) {
    imgUrl = "https://images.unsplash.com/photo-1433863448220-78aaa064ff47?q=80&w=1331&auto=format&fit=crop";
    themeClass = "theme-rain";
  } else if (weatherMain.includes("drizzle")) {
    imgUrl = "https://images.unsplash.com/photo-1638471120388-0ac73e8fe44c?q=80&w=1170&auto=format&fit=crop";
    themeClass = "theme-drizzle";
  } else if (weatherMain.includes("snow")) {
    imgUrl = "https://images.unsplash.com/photo-1616188199138-66aa6908c0e3?q=80&w=2070&auto=format&fit=crop";
    themeClass = "theme-snow";
  } else if (weatherMain.includes("thunder")) {
    imgUrl = "https://images.unsplash.com/photo-1661967102794-851ad9da6971?q=80&w=755&auto=format&fit=crop";
    themeClass = "theme-thunder";
  } else if (weatherMain.includes("mist") || weatherMain.includes("fog") || weatherMain.includes("haze")) {
    imgUrl = "https://images.unsplash.com/photo-1697016067161-9bf9e9a4e575?q=80&w=1170&auto=format&fit=crop";
    themeClass = "theme-fog";
  } else if (weatherMain.includes("smoke")) {
    imgUrl = "https://images.unsplash.com/photo-1553634854-5582930498bd?q=80&w=735&auto=format&fit=crop";
    themeClass = "theme-smoke";
  } else if (weatherMain.includes("dust") || weatherMain.includes("sand")) {
    imgUrl = "https://images.unsplash.com/photo-1722858343990-1604f540c15d?q=80&w=1170&auto=format&fit=crop";
    themeClass = "theme-dust";
  } else if (weatherMain.includes("tornado")) {
    imgUrl = "https://images.unsplash.com/photo-1696831388415-c9439da22a87?q=80&w=1207&auto=format&fit=crop";
    themeClass = "theme-tornado";
  } else {
    imgUrl = "https://cdn.pixabay.com/photo/2015/07/31/20/34/sky-869301_1280.jpg"; // Default Sky
    themeClass = "theme-default";
  }
    document.body.style.backgroundImage = `url('${imgUrl}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
}


  setWeatherTheme(data.weather[0].main);
  if (data.weather[0].main.toLowerCase().includes("rain")) {
  createRain();
} else if (data.weather[0].main.toLowerCase().includes("snow")) {
  createSnow();
} else {
  clearEffect();
}

}
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  loader.classList.add("hidden");
});


// RENDER forecast
function renderForecast(fdata){ if(!fdata||!fdata.list){ forecastEl.innerHTML='No forecast available'; return; } const today=new Date().toISOString().slice(0,10); const days={}; fdata.list.forEach(item=>{ const date=item.dt_txt.split(' ')[0]; if(!days[date]) days[date]=[]; days[date].push(item); }); const keys=Object.keys(days).sort(); const cards=[]; for(let k of keys){ const arr=days[k]; let pick=arr.find(it=>it.dt_txt.includes('12:00:00'))||arr[Math.floor(arr.length/2)]; if(!pick) continue; const min=Math.round(Math.min(...arr.map(x=>x.main.temp_min))); const max=Math.round(Math.max(...arr.map(x=>x.main.temp_max))); cards.push({date:k,tempMin:min,tempMax:max,icon:pick.weather&&pick.weather[0]&&pick.weather[0].icon,desc:pick.weather&&pick.weather[0]&&pick.weather[0].description}); if(cards.length>=5) break; } forecastEl.innerHTML=''; cards.forEach(c=>{ const d=new Date(c.date); const dayName=d.toLocaleDateString(undefined,{weekday:'short'}); const el=document.createElement('div'); el.className='fcard'; el.innerHTML=`<div style="font-weight:700">${dayName}</div><div style="margin-top:6px"><img src="https://openweathermap.org/img/wn/${c.icon}@2x.png" style="width:60px;height:60px" alt="${c.desc}"/></div><div style="margin-top:6px;font-weight:700">${c.tempMax}° / ${c.tempMin}°</div><div style="opacity:0.85;margin-top:6px;text-transform:capitalize;font-size:13px">${c.desc||''}</div>`; forecastEl.appendChild(el); });}

// message helper
function showMessage(txt,isError){ messageEl.textContent=txt||''; messageEl.style.color=isError?'#ffb4b4':'inherit';}

// keyboard focus '/'
document.addEventListener('keydown',(e)=>{ if(e.key==='/'){ e.preventDefault(); cityInput.focus(); }});

