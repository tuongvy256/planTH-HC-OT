// ============================================================
// _worker.js - Shanghai / Ô Trấn / Hàng Châu Travel Plan
// Cloudflare Pages Worker - safe for esbuild (no nested backticks)
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB;

    // GET / -> trả giao diện HTML
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(getHTML(), { headers: { "Content-Type": "text/html;charset=UTF-8" } });
    }

    // GET /api/data -> lấy toàn bộ dữ liệu
    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const { results: timeline } = await db.prepare("SELECT * FROM timeline ORDER BY day_number ASC, time_slot ASC, id ASC").all();
        const { results: checklist } = await db.prepare("SELECT * FROM checklist ORDER BY category ASC, id ASC").all();
        return jsonRes({ timeline, checklist });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    // POST /api/timeline -> thêm điểm lịch trình
    if (request.method === "POST" && url.pathname === "/api/timeline") {
      try {
        const d = await request.json();
        await db.prepare("INSERT INTO timeline (day_number,time_slot,location,location_zh,content,transport,cost_est,cost_real,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?)")
          .bind(d.day_number, d.time_slot, d.location, d.location_zh, d.content, d.transport, d.cost_est||0, d.cost_real||0, d.status||"Chua di", d.notes||"").run();
        return jsonRes({ success: true });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    // PUT /api/timeline/:id -> sửa điểm lịch trình
    if (request.method === "PUT" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        const d = await request.json();
        await db.prepare("UPDATE timeline SET day_number=?,time_slot=?,location=?,location_zh=?,content=?,transport=?,cost_est=?,cost_real=?,status=?,notes=? WHERE id=?")
          .bind(d.day_number, d.time_slot, d.location, d.location_zh, d.content, d.transport, d.cost_est||0, d.cost_real||0, d.status, d.notes||"", id).run();
        return jsonRes({ success: true });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    // DELETE /api/timeline/:id
    if (request.method === "DELETE" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM timeline WHERE id=?").bind(id).run();
        return jsonRes({ success: true });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    // POST /api/checklist -> thêm đồ hành lý
    if (request.method === "POST" && url.pathname === "/api/checklist") {
      try {
        const d = await request.json();
        await db.prepare("INSERT INTO checklist (category,item_name,is_checked) VALUES (?,?,0)")
          .bind(d.category, d.item_name).run();
        return jsonRes({ success: true });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    // PUT /api/checklist/:id -> check/uncheck
    if (request.method === "PUT" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        const d = await request.json();
        await db.prepare("UPDATE checklist SET is_checked=? WHERE id=?").bind(d.is_checked, id).run();
        return jsonRes({ success: true });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    // DELETE /api/checklist/:id
    if (request.method === "DELETE" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM checklist WHERE id=?").bind(id).run();
        return jsonRes({ success: true });
      } catch (e) { return jsonRes({ error: e.message }, 500); }
    }

    return new Response("Not Found", { status: 404 });
  }
};

function jsonRes(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json;charset=UTF-8" }
  });
}

// ============================================================
// HTML - toàn bộ giao diện nằm trong hàm này
// Dùng string ghép (không dùng backtick) để esbuild không lỗi
// ============================================================
function getHTML() {
  var css = [
    ":root{",
    "--bg:#f3f0f7;--card:#fff;--pri:#9d8df1;--pri2:#8271e2;--sec:#b8c0ff;",
    "--tx:#3d3460;--txs:#8a82a7;",
    "--sp:#f0eff5;--sa:#e8e9ff;--sd:#e3ffd6;",
    "--tp:#7a7393;--ta:#5661e5;--td:#52a135;",
    "}",
    "*{box-sizing:border-box;margin:0;padding:0;font-family:'Quicksand',-apple-system,sans-serif;-webkit-tap-highlight-color:transparent;}",
    "body{background:var(--bg);color:var(--tx);padding-bottom:100px;font-weight:500;}",
    ".header{background:linear-gradient(135deg,var(--pri),var(--sec));color:#fff;padding:30px 20px 50px;text-align:center;border-bottom-left-radius:30px;border-bottom-right-radius:30px;box-shadow:0 4px 15px rgba(157,141,241,.2);}",
    ".header h1{font-size:1.5rem;font-weight:700;margin-bottom:4px;}",
    ".header p{font-size:.85rem;opacity:.9;}",
    ".header .trip-meta{margin-top:10px;font-size:.8rem;opacity:.8;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}",
    ".container{max-width:600px;margin:-25px auto 0;padding:0 16px;}",
    ".tabs{display:flex;background:var(--card);padding:6px;border-radius:20px;margin-bottom:20px;box-shadow:0 4px 10px rgba(0,0,0,.04);overflow-x:auto;white-space:nowrap;gap:4px;}",
    ".tab-btn{flex:none;padding:8px 14px;background:none;border:none;color:var(--txs);font-size:.85rem;font-weight:700;cursor:pointer;border-radius:14px;transition:all .25s;white-space:nowrap;}",
    ".tab-btn.active{background:var(--pri);color:#fff;box-shadow:0 4px 10px rgba(157,141,241,.35);}",
    ".section-title{font-size:1rem;font-weight:700;margin:22px 0 10px 4px;display:flex;justify-content:space-between;align-items:center;color:var(--tx);}",
    ".day-label{font-size:.75rem;color:var(--txs);font-weight:600;margin:-6px 0 10px 4px;}",
    ".timeline-card{background:var(--card);border-radius:22px;padding:15px;margin-bottom:13px;box-shadow:0 4px 10px rgba(157,141,241,.07);border:1.5px solid rgba(157,141,241,.1);transition:transform .15s;}",
    ".timeline-card:active{transform:scale(.98);}",
    ".card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}",
    ".time-badge{background:#fdf0ff;color:var(--pri2);padding:3px 10px;border-radius:10px;font-size:.78rem;font-weight:700;}",
    ".status-badge{padding:3px 11px;border-radius:11px;font-size:.72rem;font-weight:700;cursor:pointer;user-select:none;transition:all .2s;}",
    ".status-badge.pending{background:var(--sp);color:var(--tp);}",
    ".status-badge.active{background:var(--sa);color:var(--ta);}",
    ".status-badge.done{background:var(--sd);color:var(--td);}",
    ".loc-title{font-size:1.05rem;font-weight:700;margin-bottom:3px;cursor:pointer;color:var(--pri2);}",
    ".loc-zh{font-size:.78rem;color:var(--txs);margin-bottom:7px;}",
    ".card-body{font-size:.87rem;color:var(--tx);background:#fcfbfe;padding:9px 11px;border-radius:13px;margin-bottom:9px;line-height:1.45;}",
    ".card-meta{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:var(--txs);}",
    ".meta-item{display:flex;align-items:center;gap:3px;}",
    ".cost-real{color:var(--tx);font-weight:700;}",
    ".checklist-group{background:var(--card);border-radius:22px;padding:15px;margin-bottom:13px;box-shadow:0 4px 10px rgba(157,141,241,.07);}",
    ".grp-title{font-weight:700;font-size:.9rem;color:var(--pri2);margin-bottom:10px;border-left:4px solid var(--pri);padding-left:8px;}",
    ".chk-item{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px dashed #f0eff5;}",
    ".chk-item:last-child{border-bottom:none;}",
    ".chk-left{display:flex;align-items:center;gap:10px;font-size:.88rem;cursor:pointer;flex:1;}",
    ".chk-left input[type=checkbox]{appearance:none;width:20px;height:20px;border:2px solid var(--sec);border-radius:50%;outline:none;cursor:pointer;display:grid;place-content:center;transition:all .2s;flex-shrink:0;}",
    ".chk-left input[type=checkbox]::before{content:'';width:10px;height:10px;border-radius:50%;transform:scale(0);transition:.2s transform;background:#fff;}",
    ".chk-left input[type=checkbox]:checked{background:var(--pri);border-color:var(--pri);}",
    ".chk-left input[type=checkbox]:checked::before{transform:scale(1);}",
    ".chk-left.done span{text-decoration:line-through;color:var(--txs);}",
    ".btn-del{background:none;border:none;color:#ff9ebb;cursor:pointer;font-size:1rem;padding:2px 6px;flex-shrink:0;}",
    ".fab{position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,var(--pri),var(--sec));color:#fff;border:none;width:54px;height:54px;border-radius:50%;font-size:1.5rem;box-shadow:0 6px 18px rgba(157,141,241,.45);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:99;transition:transform .2s;}",
    ".fab:active{transform:scale(.9);}",
    ".btn-add{background:#f3f0f7;border:2px dashed var(--pri);color:var(--pri2);padding:7px 14px;border-radius:14px;font-size:.82rem;font-weight:700;cursor:pointer;}",
    ".overlay{position:fixed;inset:0;background:rgba(61,52,96,.35);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:999;opacity:0;visibility:hidden;transition:all .3s;padding:16px;}",
    ".overlay.show{opacity:1;visibility:visible;}",
    ".modal{background:var(--card);border-radius:28px;padding:22px;width:100%;max-width:440px;box-shadow:0 15px 30px rgba(0,0,0,.1);transform:scale(.88) translateY(28px);transition:transform .3s cubic-bezier(.175,.885,.32,1.275);max-height:90vh;overflow-y:auto;}",
    ".overlay.show .modal{transform:scale(1) translateY(0);}",
    ".modal-title{font-size:1.1rem;font-weight:700;margin-bottom:14px;text-align:center;color:var(--pri2);}",
    ".fg{margin-bottom:11px;}",
    ".fg label{display:block;font-size:.78rem;font-weight:700;margin-bottom:3px;color:var(--txs);}",
    ".fg input,.fg select,.fg textarea{width:100%;padding:9px 13px;border:2px solid #e8e6f0;border-radius:13px;font-family:inherit;font-size:.88rem;outline:none;color:var(--tx);transition:border-color .2s;}",
    ".fg input:focus,.fg select:focus,.fg textarea:focus{border-color:var(--pri);}",
    ".modal-btns{display:flex;gap:10px;margin-top:18px;}",
    ".mbtn{flex:1;padding:11px;border-radius:13px;border:none;font-size:.88rem;font-weight:700;cursor:pointer;font-family:inherit;}",
    ".mbtn.cancel{background:#f0eff5;color:var(--txs);}",
    ".mbtn.save{background:linear-gradient(135deg,var(--pri),var(--sec));color:#fff;}",
    ".empty{text-align:center;padding:28px 16px;color:var(--txs);font-size:.88rem;line-height:1.6;}",
    ".toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);background:#3d3460;color:#fff;padding:10px 20px;border-radius:20px;font-size:.85rem;font-weight:600;opacity:0;transition:all .3s;z-index:9999;white-space:nowrap;}",
    ".toast.show{opacity:1;transform:translateX(-50%) translateY(0);}"
  ].join("");

  var html = [
    "<!DOCTYPE html>",
    "<html lang='vi'>",
    "<head>",
    "<meta charset='UTF-8'>",
    "<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no'>",
    "<title>Plan Du Lich TH-HC-OT</title>",
    "<link rel='preconnect' href='https://fonts.googleapis.com'>",
    "<link rel='preconnect' href='https://fonts.gstatic.com' crossorigin>",
    "<link href='https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap' rel='stylesheet'>",
    "<style>" + css + "</style>",
    "</head>",
    "<body>",

    // HEADER
    "<div class='header'>",
    "<h1>Plan Du Lich 2025 ✈️</h1>",
    "<p>Thuong Hai · O Tran · Hang Chau</p>",
    "<div class='trip-meta'>",
    "<span>📅 31/8 - 05/9/2025</span>",
    "<span>🇨🇳 6 ngay 5 dem</span>",
    "<span>👯 Girls trip</span>",
    "</div>",
    "</div>",

    // CONTAINER
    "<div class='container'>",

    // TABS + TIMELINE
    "<div class='section-title'><span>Lich Trinh Chi Tiet 🗺️</span></div>",
    "<div class='tabs' id='dayTabs'></div>",
    "<div class='day-label' id='dayLabel'></div>",
    "<div id='timelineContainer'></div>",

    // CHECKLIST
    "<div class='section-title'>",
    "<span>Hanh Ly Chuan Bi 🎒</span>",
    "<button class='btn-add' onclick='openCheckModal()'>+ Them do</button>",
    "</div>",
    "<div id='checklistContainer'></div>",
    "</div>",

    // FAB
    "<button class='fab' onclick='openTimelineModal()' title='Them diem moi'>＋</button>",

    // TOAST
    "<div class='toast' id='toast'></div>",

    // MODAL: TIMELINE
    "<div class='overlay' id='tlModal'>",
    "<div class='modal'>",
    "<div class='modal-title' id='tlModalTitle'>Them Diem Di Moi ✨</div>",
    "<input type='hidden' id='fId'>",
    "<div class='fg'><label>Ngay may na?</label>",
    "<select id='fDay'>",
    "<option value='1'>Ngay 1 - Thu (31/8) - Bay sang TH</option>",
    "<option value='2'>Ngay 2 - Thu (01/9) - Thuong Hai</option>",
    "<option value='3'>Ngay 3 - Thu (02/9) - Thuong Hai</option>",
    "<option value='4'>Ngay 4 - Thu (03/9) - O Tran</option>",
    "<option value='5'>Ngay 5 - Thu (04/9) - Hang Chau</option>",
    "<option value='6'>Ngay 6 - Thu (05/9) - Bay ve</option>",
    "</select></div>",
    "<div class='fg'><label>Khung gio (VD: 08:30 - 10:00)</label>",
    "<input type='text' id='fSlot' placeholder='Nhap gio giac nha...'></div>",
    "<div class='fg'><label>Ten dia danh (Tieng Viet)</label>",
    "<input type='text' id='fLoc' placeholder='VD: Ben Thuong Hai'></div>",
    "<div class='fg'><label>Ten dia danh (Tieng Trung)</label>",
    "<input type='text' id='fLocZh' placeholder='VD: 外滩'></div>",
    "<div class='fg'><label>Noi dung hoat dong</label>",
    "<textarea id='fContent' rows='3' placeholder='Ba dinh lam gi o day do...'></textarea></div>",
    "<div class='fg'><label>Phuong tien di chuyen</label>",
    "<input type='text' id='fTransport' placeholder='VD: Metro Line 2, Di bo...'></div>",
    "<div class='fg'><label>Chi phi du kien (Te)</label>",
    "<input type='number' id='fCostE' value='0'></div>",
    "<div class='fg'><label>Chi phi thuc te (Te)</label>",
    "<input type='number' id='fCostR' value='0'></div>",
    "<div class='fg'><label>Trang thai</label>",
    "<select id='fStatus'>",
    "<option value='Chua di'>Chua di ✈️</option>",
    "<option value='Dang di'>Dang di 🚗</option>",
    "<option value='Da xong'>Da xong ✅</option>",
    "</select></div>",
    "<div class='modal-btns'>",
    "<button class='mbtn cancel' onclick='closeModal(\"tlModal\")'>Huy ne</button>",
    "<button class='mbtn save' onclick='saveTL()'>Luu luon 💾</button>",
    "</div>",
    "</div></div>",

    // MODAL: CHECKLIST
    "<div class='overlay' id='chkModal'>",
    "<div class='modal'>",
    "<div class='modal-title'>Chuan Bi Hanh Ly 🎒</div>",
    "<div class='fg'><label>Danh muc (VD: Giay to, Quan ao, Do makeup...)</label>",
    "<input type='text' id='fCat' placeholder='Nhap nhom do vat...'></div>",
    "<div class='fg'><label>Ten mon do</label>",
    "<input type='text' id='fItem' placeholder='VD: Ho chieu, Sac du phong...'></div>",
    "<div class='modal-btns'>",
    "<button class='mbtn cancel' onclick='closeModal(\"chkModal\")'>Thoi dep</button>",
    "<button class='mbtn save' onclick='saveChk()'>Them le 🛍️</button>",
    "</div>",
    "</div></div>",

    // SCRIPT
    "<script>",
    "(function(){",

    // --- DATA ---
    "var DAY_NAMES = ['','Bay sang (31/8)','Thuong Hai (01/9)','Thuong Hai (02/9)','O Tran (03/9)','Hang Chau (04/9)','Bay ve (05/9)'];",
    "var currentDay = 1;",
    "var TL = [];",
    "var CL = [];",

    // --- TOAST ---
    "function toast(msg){",
    "  var t = document.getElementById('toast');",
    "  t.textContent = msg; t.classList.add('show');",
    "  setTimeout(function(){ t.classList.remove('show'); }, 2000);",
    "}",

    // --- FETCH ---
    "function loadData(){",
    "  fetch('/api/data').then(function(r){ return r.json(); }).then(function(d){",
    "    TL = d.timeline || [];",
    "    CL = d.checklist || [];",
    "    renderTabs(); renderTL(); renderCL();",
    "  }).catch(function(e){ toast('Loi tai du lieu!'); });",
    "}",

    // --- TABS ---
    "function renderTabs(){",
    "  var el = document.getElementById('dayTabs');",
    "  var max = 6;",
    "  TL.forEach(function(x){ if(x.day_number > max) max = x.day_number; });",
    "  var h = '';",
    "  for(var i=1;i<=max;i++){",
    "    h += '<button class=\"tab-btn' + (i===currentDay?' active':'') + '\" onclick=\"switchDay(' + i + ')\">Ngay ' + i + '</button>';",
    "  }",
    "  el.innerHTML = h;",
    "  var lbl = document.getElementById('dayLabel');",
    "  lbl.textContent = DAY_NAMES[currentDay] || '';",
    "}",

    "function switchDay(d){ currentDay=d; renderTabs(); renderTL(); }",

    // --- RENDER TIMELINE ---
    "function renderTL(){",
    "  var el = document.getElementById('timelineContainer');",
    "  var items = TL.filter(function(x){ return x.day_number===currentDay; });",
    "  if(!items.length){",
    "    el.innerHTML = '<div class=\"empty\">Hom nay trong lich roi ba oi!<br>Bam nut <b>＋</b> goc duoi de them diem di nha! 🌸</div>';",
    "    return;",
    "  }",
    "  var h = '';",
    "  items.forEach(function(item){",
    "    var sc = item.status==='Dang di'?'active':item.status==='Da xong'?'done':'pending';",
    "    var ic = item.status==='Dang di'?'🚗':item.status==='Da xong'?'✅':'🗺️';",
    "    var cost = item.cost_real>0?item.cost_real:item.cost_est;",
    "    h += '<div class=\"timeline-card\">';",
    "    h += '<div class=\"card-top\">';",
    "    h += '<span class=\"time-badge\">🕒 ' + (item.time_slot||'Chua dinh gio') + '</span>';",
    "    h += '<span class=\"status-badge ' + sc + '\" onclick=\"toggleStatus(' + item.id + ',\\''+item.status+'\\')\">' + ic + ' ' + item.status + '</span>';",
    "    h += '</div>';",
    "    h += '<div class=\"loc-title\" onclick=\"editTL(' + item.id + ')\">' + item.location + '</div>';",
    "    if(item.location_zh) h += '<div class=\"loc-zh\">🇨🇳 ' + item.location_zh + '</div>';",
    "    if(item.content) h += '<div class=\"card-body\">' + item.content.replace(/\\n/g,'<br>') + '</div>';",
    "    h += '<div class=\"card-meta\">';",
    "    h += '<div class=\"meta-item\">🚇 ' + (item.transport||'Tu tuc') + '</div>';",
    "    h += '<div class=\"meta-item cost-real\">💰 ' + cost + ' Te</div>';",
    "    h += '<button class=\"btn-del\" onclick=\"delTL(' + item.id + ')\">🗑️</button>';",
    "    h += '</div></div>';",
    "  });",
    "  el.innerHTML = h;",
    "}",

    // --- RENDER CHECKLIST ---
    "function renderCL(){",
    "  var el = document.getElementById('checklistContainer');",
    "  if(!CL.length){",
    "    el.innerHTML = '<div class=\"empty\">Chua soan mon nao het tron!<br>Bam \"Them do\" de bat dau chuan bi nha 🎒</div>';",
    "    return;",
    "  }",
    "  var groups = {};",
    "  CL.forEach(function(x){",
    "    var c = x.category||'Do dung khac';",
    "    if(!groups[c]) groups[c]=[];",
    "    groups[c].push(x);",
    "  });",
    "  var h = '';",
    "  Object.keys(groups).forEach(function(cat){",
    "    h += '<div class=\"checklist-group\">';",
    "    h += '<div class=\"grp-title\">' + cat + '</div>';",
    "    groups[cat].forEach(function(item){",
    "      var ck = item.is_checked===1;",
    "      h += '<div class=\"chk-item\">';",
    "      h += '<div class=\"chk-left' + (ck?' done':'') + '\" onclick=\"toggleCL(' + item.id + ',' + (!ck) + ')\">';",
    "      h += '<input type=\"checkbox\"' + (ck?' checked':'') + ' onclick=\"event.stopPropagation();toggleCL(' + item.id + ',this.checked)\">';",
    "      h += '<span>' + item.item_name + '</span></div>';",
    "      h += '<button class=\"btn-del\" onclick=\"delCL(' + item.id + ')\">🗑️</button>';",
    "      h += '</div>';",
    "    });",
    "    h += '</div>';",
    "  });",
    "  el.innerHTML = h;",
    "}",

    // --- MODAL HELPERS ---
    "function closeModal(id){ document.getElementById(id).classList.remove('show'); }",
    "function openModal(id){ document.getElementById(id).classList.add('show'); }",

    // --- TIMELINE MODAL ---
    "function openTimelineModal(){",
    "  document.getElementById('tlModalTitle').textContent = 'Them Diem Di Moi ✨';",
    "  document.getElementById('fId').value = '';",
    "  document.getElementById('fDay').value = currentDay;",
    "  document.getElementById('fSlot').value = '';",
    "  document.getElementById('fLoc').value = '';",
    "  document.getElementById('fLocZh').value = '';",
    "  document.getElementById('fContent').value = '';",
    "  document.getElementById('fTransport').value = '';",
    "  document.getElementById('fCostE').value = 0;",
    "  document.getElementById('fCostR').value = 0;",
    "  document.getElementById('fStatus').value = 'Chua di';",
    "  openModal('tlModal');",
    "}",

    "function editTL(id){",
    "  var item = null;",
    "  for(var i=0;i<TL.length;i++){ if(TL[i].id===id){ item=TL[i]; break; } }",
    "  if(!item) return;",
    "  document.getElementById('tlModalTitle').textContent = 'Sua Lich Trinh ✏️';",
    "  document.getElementById('fId').value = item.id;",
    "  document.getElementById('fDay').value = item.day_number;",
    "  document.getElementById('fSlot').value = item.time_slot||'';",
    "  document.getElementById('fLoc').value = item.location||'';",
    "  document.getElementById('fLocZh').value = item.location_zh||'';",
    "  document.getElementById('fContent').value = item.content||'';",
    "  document.getElementById('fTransport').value = item.transport||'';",
    "  document.getElementById('fCostE').value = item.cost_est||0;",
    "  document.getElementById('fCostR').value = item.cost_real||0;",
    "  document.getElementById('fStatus').value = item.status||'Chua di';",
    "  openModal('tlModal');",
    "}",

    "function saveTL(){",
    "  var id = document.getElementById('fId').value;",
    "  var loc = document.getElementById('fLoc').value.trim();",
    "  if(!loc){ alert('Ten dia danh khong duoc bo trong nha!'); return; }",
    "  var payload = {",
    "    day_number: parseInt(document.getElementById('fDay').value),",
    "    time_slot: document.getElementById('fSlot').value,",
    "    location: loc,",
    "    location_zh: document.getElementById('fLocZh').value,",
    "    content: document.getElementById('fContent').value,",
    "    transport: document.getElementById('fTransport').value,",
    "    cost_est: parseFloat(document.getElementById('fCostE').value)||0,",
    "    cost_real: parseFloat(document.getElementById('fCostR').value)||0,",
    "    status: document.getElementById('fStatus').value",
    "  };",
    "  var url = '/api/timeline';",
    "  var method = 'POST';",
    "  if(id){ url = '/api/timeline/' + id; method = 'PUT'; }",
    "  fetch(url, { method:method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })",
    "    .then(function(){ closeModal('tlModal'); loadData(); toast('Da luu! 🎉'); })",
    "    .catch(function(){ toast('Loi luu du lieu!'); });",
    "}",

    // --- TOGGLE STATUS ---
    "function toggleStatus(id, cur){",
    "  var next = cur==='Chua di'?'Dang di':cur==='Dang di'?'Da xong':'Chua di';",
    "  var item = null;",
    "  for(var i=0;i<TL.length;i++){ if(TL[i].id===id){ item=TL[i]; break; } }",
    "  if(!item) return;",
    "  var p = JSON.parse(JSON.stringify(item));",
    "  p.status = next;",
    "  fetch('/api/timeline/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(p) })",
    "    .then(function(){ loadData(); })",
    "    .catch(function(){ toast('Loi cap nhat!'); });",
    "}",

    // --- DELETE TIMELINE ---
    "function delTL(id){",
    "  if(!confirm('Xoa diem lich trinh nay khong do?')) return;",
    "  fetch('/api/timeline/'+id, { method:'DELETE' })",
    "    .then(function(){ loadData(); toast('Da xoa! 🗑️'); })",
    "    .catch(function(){ toast('Loi xoa!'); });",
    "}",

    // --- CHECKLIST MODAL ---
    "function openCheckModal(){",
    "  document.getElementById('fCat').value='';",
    "  document.getElementById('fItem').value='';",
    "  openModal('chkModal');",
    "}",

    "function saveChk(){",
    "  var cat = document.getElementById('fCat').value.trim()||'Do dung khac';",
    "  var name = document.getElementById('fItem').value.trim();",
    "  if(!name){ alert('Ten mon do chua nhap kia!'); return; }",
    "  fetch('/api/checklist', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({category:cat,item_name:name}) })",
    "    .then(function(){ closeModal('chkModal'); loadData(); toast('Da them do! 🛍️'); })",
    "    .catch(function(){ toast('Loi them do!'); });",
    "}",

    "function toggleCL(id, checked){",
    "  fetch('/api/checklist/'+id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({is_checked:checked?1:0}) })",
    "    .then(function(){ loadData(); })",
    "    .catch(function(){ toast('Loi cap nhat!'); });",
    "}",

    "function delCL(id){",
    "  if(!confirm('Xoa mon do nay ra khoi danh sach?')) return;",
    "  fetch('/api/checklist/'+id, { method:'DELETE' })",
    "    .then(function(){ loadData(); toast('Da xoa! 🗑️'); })",
    "    .catch(function(){ toast('Loi xoa!'); });",
    "}",

    // --- CLOSE MODAL ON OVERLAY CLICK ---
    "document.querySelectorAll('.overlay').forEach(function(ov){",
    "  ov.addEventListener('click', function(e){",
    "    if(e.target===ov) ov.classList.remove('show');",
    "  });",
    "});",

    // --- INIT ---
    "loadData();",
    "})();",
    "<\/script>",
    "</body></html>"
  ].join("\n");

  return html;
}
