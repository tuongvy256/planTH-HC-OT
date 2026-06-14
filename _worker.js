export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB;

    // 1. Trả về giao diện chính với tone màu Việt Quất & Sữa Khoai Môn
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(getHtmlContent(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // 2. Lấy toàn bộ dữ liệu lịch trình & hành lý
    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const { results: timeline } = await db.prepare("SELECT * FROM timeline ORDER BY day_number ASC, time_slot ASC, id ASC").all();
        const { results: checklist } = await db.prepare("SELECT * FROM checklist ORDER BY category ASC, id ASC").all();
        return jsonResponse({ timeline, checklist });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 3. Thêm mới một điểm lịch trình
    if (request.method === "POST" && url.pathname === "/api/timeline") {
      try {
        const data = await request.json();
        await db.prepare(`
          INSERT INTO timeline (day_number, time_slot, location, location_zh, content, transport, cost_est, cost_real, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.day_number, data.time_slot, data.location, data.location_zh,
          data.content, data.transport, data.cost_est || 0, data.cost_real || 0,
          data.status || "Chưa đi", data.notes || ""
        ).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 4. Sửa/Cập nhật một điểm lịch trình
    if (request.method === "PUT" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        const data = await request.json();
        await db.prepare(`
          UPDATE timeline 
          SET day_number = ?, time_slot = ?, location = ?, location_zh = ?, content = ?, transport = ?, cost_est = ?, cost_real = ?, status = ?, notes = ?
          WHERE id = ?
        `).bind(
          data.day_number, data.time_slot, data.location, data.location_zh,
          data.content, data.transport, data.cost_est || 0, data.cost_real || 0,
          data.status, data.notes || "", id
        ).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 5. Xóa điểm lịch trình
    if (request.method === "DELETE" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM timeline WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 6. Thêm mới một món đồ hành lý
    if (request.method === "POST" && url.pathname === "/api/checklist") {
      try {
        const data = await request.json();
        await db.prepare(`
          INSERT INTO checklist (category, item_name, is_checked)
          VALUES (?, ?, 0)
        `).bind(data.category, data.item_name).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 7. Check/Uncheck đồ hành lý
    if (request.method === "PUT" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        const data = await request.json();
        await db.prepare("UPDATE checklist SET is_checked = ? WHERE id = ?")
                .bind(data.is_checked, id).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 8. Xóa món đồ hành lý
    if (request.method === "DELETE" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM checklist WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json;charset=UTF-8" }
  });
}

// "Hóa phép" nhét toàn bộ giao diện siêu cute vào đây luôn nà bà iu!
function getHtmlContent() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Shanghai Travel Plan 🇨🇳</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --bg-color: #f3f0f7;
            --card-bg: #ffffff;
            --primary: #9d8df1;
            --primary-dark: #8271e2;
            --secondary: #b8c0ff;
            --text-main: #3d3460;
            --text-sub: #8a82a7;
            
            --status-pending: #f0eff5;
            --status-active: #e8e9ff;
            --status-done: #e3ffd6;
            --text-pending: #7a7393;
            --text-active: #5661e5;
            --text-done: #52a135;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Quicksand', -apple-system, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-main);
            padding-bottom: 100px;
            font-weight: 500;
        }

        .header {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: #ffffff;
            padding: 30px 20px 40px 20px;
            text-align: center;
            border-bottom-left-radius: 30px;
            border-bottom-right-radius: 30px;
            box-shadow: 0 4px 15px rgba(157, 141, 241, 0.2);
        }

        .header h1 {
            font-size: 1.6rem;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .header p {
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .container {
            max-width: 600px;
            margin: -20px auto 0 auto;
            padding: 0 16px;
        }

        .tabs {
            display: flex;
            background: var(--card-bg);
            padding: 6px;
            border-radius: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.04);
            overflow-x: auto;
            white-space: nowrap;
        }

        .tab-btn {
            flex: 1;
            text-align: center;
            padding: 10px 15px;
            background: none;
            border: none;
            color: var(--text-sub);
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
            border-radius: 15px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tab-btn.active {
            background: var(--primary);
            color: #ffffff;
            box-shadow: 0 4px 10px rgba(157, 141, 241, 0.3);
        }

        .section-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin: 25px 0 12px 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .timeline-card {
            background: var(--card-bg);
            border-radius: 24px;
            padding: 16px;
            margin-bottom: 15px;
            box-shadow: 0 6px 12px rgba(157, 141, 241, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.8);
            position: relative;
            transition: transform 0.2s ease;
        }

        .timeline-card:active {
            transform: scale(0.98);
        }

        .card-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .time-badge {
            background: #fdf0ff;
            color: var(--primary-dark);
            padding: 4px 10px;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 700;
        }

        .status-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            user-select: none;
            transition: all 0.2s ease;
        }
        .status-badge.pending { background: var(--status-pending); color: var(--text-pending); }
        .status-badge.active { background: var(--status-active); color: var(--text-active); }
        .status-badge.done { background: var(--status-done); color: var(--text-done); }

        .location-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .location-zh {
            font-size: 0.8rem;
            color: var(--text-sub);
            margin-bottom: 8px;
        }

        .card-content {
            font-size: 0.9rem;
            color: var(--text-main);
            background: #fcfbfe;
            padding: 10px;
            border-radius: 14px;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .card-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: var(--text-sub);
        }

        .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .checklist-group {
            background: var(--card-bg);
            border-radius: 24px;
            padding: 16px;
            margin-bottom: 15px;
            box-shadow: 0 6px 12px rgba(157, 141, 241, 0.05);
        }

        .group-title {
            font-weight: 700;
            font-size: 0.95rem;
            color: var(--primary-dark);
            margin-bottom: 10px;
            border-left: 4px solid var(--primary);
            padding-left: 8px;
        }

        .checklist-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #f0eff5;
        }

        .checklist-item:last-child {
            border-bottom: none;
        }

        .chk-left {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 0.9rem;
            cursor: pointer;
        }

        .chk-left input[type="checkbox"] {
            appearance: none;
            width: 20px;
            height: 20px;
            border: 2px solid var(--secondary);
            border-radius: 50%;
            outline: none;
            cursor: pointer;
            display: grid;
            place-content: center;
            transition: all 0.2s ease;
        }

        .chk-left input[type="checkbox"]::before {
            content: "";
            width: 10px;
            height: 10px;
            border-radius: 50%;
            transform: scale(0);
            transition: 0.2s transform ease-in-out;
            background-color: white;
        }

        .chk-left input[type="checkbox"]:checked {
            background-color: var(--primary);
            border-color: var(--primary);
        }

        .chk-left input[type="checkbox"]:checked::before {
            transform: scale(1);
        }

        .chk-left.checked span {
            text-decoration: line-through;
            color: var(--text-sub);
        }

        .btn-mini-delete {
            background: none;
            border: none;
            color: #ff9ebb;
            cursor: pointer;
            font-size: 1rem;
            padding: 2px 6px;
        }

        .fab-btn {
            position: fixed;
            bottom: 25px;
            right: 25px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            border: none;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            font-size: 1.5rem;
            box-shadow: 0 6px 20px rgba(157, 141, 241, 0.4);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99;
            transition: transform 0.2s ease;
        }
        .fab-btn:active { transform: scale(0.9); }

        .btn-add-text {
            background: #f3f0f7;
            border: 2px dashed var(--primary);
            color: var(--primary-dark);
            padding: 8px 16px;
            border-radius: 16px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
        }

        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(61, 52, 96, 0.3);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            padding: 16px;
        }

        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .modal-content {
            background: var(--card-bg);
            border-radius: 30px;
            padding: 24px;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            transform: scale(0.85) translateY(30px);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .modal-overlay.active .modal-content {
            transform: scale(1) translateY(0);
        }

        .modal-header {
            font-size: 1.2rem;
            font-weight: 700;
            margin-bottom: 15px;
            text-align: center;
            color: var(--primary-dark);
        }

        .form-group {
            margin-bottom: 12px;
        }

        .form-group label {
            display: block;
            font-size: 0.8rem;
            font-weight: 700;
            margin-bottom: 4px;
            color: var(--text-sub);
        }

        .form-group input, .form-group select, .form-group textarea {
            width: 100%;
            padding: 10px 14px;
            border: 2px solid #e8e6f0;
            border-radius: 14px;
            font-family: inherit;
            font-size: 0.9rem;
            outline: none;
            color: var(--text-main);
            transition: border-color 0.2s;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
            border-color: var(--primary);
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        .btn-modal {
            flex: 1;
            padding: 12px;
            border-radius: 14px;
            border: none;
            font-size: 0.9rem;
            font-weight: 700;
            cursor: pointer;
        }

        .btn-modal.cancel {
            background: #f0eff5;
            color: var(--text-sub);
        }

        .btn-modal.save {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>Shanghai Travel Plan 🇨🇳</h1>
        <p>Giao diện xinh xỉu cho bà iu quẩy Thượng Hải ✨</p>
    </div>

    <div class="container">
        <div class="section-title">Lịch Trình Chi Tiết</div>
        <div class="tabs" id="dayTabs"></div>
        <div id="timelineContainer"></div>

        <div class="section-title">
            <span>Hành Lý Chuẩn Bị 🎒</span>
            <button class="btn-add-text" onclick="openChecklistModal()">+ Thêm đồ</button>
        </div>
        <div id="checklistContainer"></div>
    </div>

    <button class="fab-btn" onclick="openTimelineModal()">＋</button>

    <div class="modal-overlay" id="timelineModal">
        <div class="modal-content">
            <div class="modal-header" id="timelineModalTitle">Thêm Điểm Đi Mới ✨</div>
            <input type="hidden" id="formTimelineId">
            <div class="form-group">
                <label>Ngày mấy nà?</label>
                <select id="formDayNumber">
                    <option value="1">Ngày 1 (31/8)</option>
                    <option value="2">Ngày 2 (01/9)</option>
                    <option value="3">Ngày 3 (02/9)</option>
                    <option value="4">Ngày 4 (03/9)</option>
                    <option value="5">Ngày 5 (04/9)</option>
                    <option value="6">Ngày 6 (05/9)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Khung giờ (Ví dụ: 08:30 - 10:00)</label>
                <input type="text" id="formTimeSlot" placeholder="Nhập giờ giấc nha...">
            </div>
            <div class="form-group">
                <label>Tên địa danh (Tiếng Việt)</label>
                <input type="text" id="formLocation" placeholder="Ví dụ: Bến Thượng Hải">
            </div>
            <div class="form-group">
                <label>Tên địa danh (Tiếng Trung - nếu có)</label>
                <input type="text" id="formLocationZh" placeholder="Ví dụ: 外滩">
            </div>
            <div class="form-group">
                <label>Nội dung hoạt động chi tiết</label>
                <textarea id="formContent" rows="3" placeholder="Bà định làm gì ở đây dọ..."></textarea>
            </div>
            <div class="form-group">
                <label>Phương tiện di chuyển</label>
                <input type="text" id="formTransport" placeholder="Ví dụ: Metro Line 2, Đi bộ...">
            </div>
            <div class="form-group">
                <label>Chi phí dự kiến (Tệ)</label>
                <input type="number" id="formCostEst" value="0">
            </div>
            <div class="form-group">
                <label>Chi phí thực tế (Tệ)</label>
                <input type="number" id="formCostReal" value="0">
            </div>
            <div class="form-group">
                <label>Trạng thái</label>
                <select id="formStatus">
                    <option value="Chưa đi">Chưa đi ✈️</option>
                    <option value="Đang đi">Đang đi 🚗</option>
                    <option value="Đã xong">Đã xong ✅</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button class="btn-modal cancel" onclick="closeModal('timelineModal')">Hủy nè</button>
                <button class="btn-modal save" onclick="saveTimelineData()">Lưu luôn</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" id="checklistModal">
        <div class="modal-content">
            <div class="modal-header">Chuẩn Bị Hành Lý Đê 🎉</div>
            <div class="form-group">
                <label>Danh mục (Ví dụ: Giấy tờ, Quần áo, Đồ makeup...)</label>
                <input type="text" id="formChecklistCategory" placeholder="Nhập nhóm đồ vật...">
            </div>
            <div class="form-group">
                <label>Tên món đồ</label>
                <input type="text" id="formChecklistItemName" placeholder="Ví dụ: Hộ chiếu, Sạc dự phòng...">
            </div>
            <div class="modal-buttons">
                <button class="btn-modal cancel" onclick="closeModal('checklistModal')">Thôi dẹp</button>
                <button class="btn-modal save" onclick="saveChecklistData()">Thêm lẹ</button>
            </div>
        </div>
    </div>

    <script>
        let currentDay = 1;
        let globalTimelineData = [];
        let globalChecklistData = [];

        async function fetchAllData() {
            const res = await fetch('/api/data');
            const data = await res.json();
            
            globalTimelineData = data.timeline || [];
            globalChecklistData = data.checklist || [];

            renderTabs();
            renderTimeline();
            renderChecklist();
        }

        function renderTabs() {
            const tabsContainer = document.getElementById('dayTabs');
            let maxDay = 6;
            globalTimelineData.forEach(item => {
                if(item.day_number > maxDay) maxDay = item.day_number;
            });

            let html = '';
            for(let i = 1; i <= maxDay; i++) {
                html += `<button class="tab-btn ${i === currentDay ? 'active' : ''}" onclick="switchDay(${i})">Ngày ${i}</button>`;
            }
            tabsContainer.innerHTML = html;
        }

        function switchDay(day) {
            currentDay = day;
            renderTabs();
            renderTimeline();
        }

        function renderTimeline() {
            const container = document.getElementById('timelineContainer');
            const filtered = globalTimelineData.filter(item => item.day_number === currentDay);

            if(filtered.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-sub); font-size:0.9rem;">Hôm nay trống lịch rồi bà ơi, bấm nút ＋ góc dưới để thêm điểm đi nha!</div>`;
                return;
            }

            let html = '';
            filtered.forEach(item => {
                let statusClass = 'pending';
                if(item.status === 'Đang đi') statusClass = 'active';
                if(item.status === 'Đã xong') statusClass = 'done';

                let motionIcon = '✈️';
                if(item.status === 'Đang đi') motionIcon = '🚗';
                if(item.status === 'Đã xong') motionIcon = '🎉';

                html += `
                    <div class="timeline-card">
                        <div class="card-top">
                            <span class="time-badge">🕒 ${item.time_slot || 'Chưa định giờ'}</span>
                            <span class="status-badge ${statusClass}" onclick="quickToggleStatus(${item.id}, '${item.status}')">
                                ${item.status || 'Chưa đi'} ${motionIcon}
                            </span>
                        </div>
                        <div class="location-title" onclick="editTimeline(${item.id})" style="cursor:pointer; color:var(--primary-dark)">
                            ${item.location}
                        </div>
                        ${item.location_zh ? `<div class="location-zh">🇨🇳 ${item.location_zh}</div>` : ''}
                        ${item.content ? `<div class="card-content">${item.content.replace(/\n/g, '<br>')}</div>` : ''}
                        
                        <div class="card-meta">
                            <div class="meta-item">🚇 ${item.transport || 'Tự túc'}</div>
                            <div class="meta-item" style="color:var(--text-main); font-weight:700;">💰 ${item.cost_real > 0 ? item.cost_real : item.cost_est} Tệ</div>
                            <button class="btn-mini-delete" onclick="deleteTimeline(${item.id})">🗑️</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        function renderChecklist() {
            const container = document.getElementById('checklistContainer');
            if(globalChecklistData.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-sub); font-size:0.9rem;">Chưa soạn món nào hết trơn! Bấm "Thêm đồ" đi bà.</div>`;
                return;
            }

            const groups = {};
            globalChecklistData.forEach(item => {
                const cat = item.category || "Đồ dùng khác";
                if(!groups[cat]) groups[cat] = [];
                groups[cat].push(item);
            });

            let html = '';
            for(const cat in groups) {
                html += `<div class="checklist-group"><div class="group-title">${cat}</div>`;
                groups[cat].forEach(item => {
                    const isChecked = item.is_checked === 1;
                    html += `
                        <div class="checklist-item">
                            <div class="chk-left ${isChecked ? 'checked' : ''}" onclick="toggleChecklist(${item.id}, ${!isChecked})">
                                <input type="checkbox" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation(); toggleChecklist(${item.id}, this.checked)">
                                <span>${item.item_name}</span>
                            </div>
                            <button class="btn-mini-delete" onclick="deleteChecklistItem(${item.id})">🗑️</button>
                        </div>
                    `;
                });
                html += `</div>`;
            }
            container.innerHTML = html;
        }

        function openModal(id) {
            document.getElementById(id).classList.add('active');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        function openTimelineModal() {
            document.getElementById('timelineModalTitle').innerText = "Thêm Điểm Đi Mới ✨";
            document.getElementById('formTimelineId').value = '';
            document.getElementById('formDayNumber').value = currentDay;
            document.getElementById('formTimeSlot').value = '';
            document.getElementById('formLocation').value = '';
            document.getElementById('formLocationZh').value = '';
            document.getElementById('formContent').value = '';
            document.getElementById('formTransport').value = '';
            document.getElementById('formCostEst').value = 0;
            document.getElementById('formCostReal').value = 0;
            document.getElementById('formStatus').value = 'Chưa đi';
            openModal('timelineModal');
        }

        function editTimeline(id) {
            const item = globalTimelineData.find(x => x.id === id);
            if(!item) return;

            document.getElementById('timelineModalTitle').innerText = "Sửa Lịch Trình ✏️";
            document.getElementById('formTimelineId').value = item.id;
            document.getElementById('formDayNumber').value = item.day_number;
            document.getElementById('formTimeSlot').value = item.time_slot || '';
            document.getElementById('formLocation').value = item.location || '';
            document.getElementById('formLocationZh').value = item.location_zh || '';
            document.getElementById('formContent').value = item.content || '';
            document.getElementById('formTransport').value = item.transport || '';
            document.getElementById('formCostEst').value = item.cost_est || 0;
            document.getElementById('formCostReal').value = item.cost_real || 0;
            document.getElementById('formStatus').value = item.status || 'Chưa đi';
            openModal('timelineModal');
        }

        async function saveTimelineData() {
            const id = document.getElementById('formTimelineId').value;
            const payload = {
                day_number: parseInt(document.getElementById('formDayNumber').value),
                time_slot: document.getElementById('formTimeSlot').value,
                location: document.getElementById('formLocation').value,
                location_zh: document.getElementById('formLocationZh').value,
                content: document.getElementById('formContent').value,
                transport: document.getElementById('formTransport').value,
                cost_est: parseFloat(document.getElementById('formCostEst').value) || 0,
                cost_real: parseFloat(document.getElementById('formCostReal').value) || 0,
                status: document.getElementById('formStatus').value
            };

            if(!payload.location) {
                alert("Địa danh không được bỏ trống đâu nha bà ơi!");
                return;
            }

            let url = '/api/timeline';
            let method = 'POST';
            if(id) {
                url = `/api/timeline/${id}`;
                method = 'PUT';
            }

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            closeModal('timelineModal');
            fetchAllData();
        }

        async function quickToggleStatus(id, currentStatus) {
            let nextStatus = 'Chưa đi';
            if(currentStatus === 'Chưa đi') nextStatus = 'Đang đi';
            else if(currentStatus === 'Đang đi') nextStatus = 'Đã xong';

            const item = globalTimelineData.find(x => x.id === id);
            if(!item) return;

            const payload = { ...item, status: nextStatus };
            await fetch(`/api/timeline/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            fetchAllData();
        }

        async function deleteTimeline(id) {
            if(confirm("Bà có chắc muốn xóa điểm lịch trình này không dọ?")) {
                await fetch(`/api/timeline/${id}`, { method: 'DELETE' });
                fetchAllData();
            }
        }

        function openChecklistModal() {
            document.getElementById('formChecklistCategory').value = '';
            document.getElementById('formChecklistItemName').value = '';
            openModal('checklistModal');
        }

        async function saveChecklistData() {
            const cat = document.getElementById('formChecklistCategory').value.trim() || "Đồ dùng khác";
            const name = document.getElementById('formChecklistItemName').value.trim();

            if(!name) {
                alert("Món này tên gì bà chưa nhập kìa!");
                return;
            }

            await fetch('/api/checklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: cat, item_name: name })
            });

            closeModal('checklistModal');
            fetchAllData();
        }

        async function toggleChecklist(id, isChecked) {
            await fetch(`/api/checklist/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_checked: isChecked ? 1 : 0 })
            });
            fetchAllData();
        }

        async function deleteChecklistItem(id) {
            if(confirm("Xóa món đồ này ra khỏi danh sách chuẩn bị nha bà iu?")) {
                await fetch(`/api/checklist/${id}`, { method: 'DELETE' });
                fetchAllData();
            }
        }

        window.onload = fetchAllData;
    </script>
</body>
</html>`;
}
