export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB;

    // 1. LẤY TOÀN BỘ DỮ LIỆU (Đã kèm kết hợp Chi Phí)
    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const { results: timeline } = await db.prepare("SELECT * FROM timeline ORDER BY day_number ASC, time_slot ASC, id ASC").all();
        const { results: costs } = await db.prepare("SELECT * FROM costs").all();
        const { results: checklist } = await db.prepare("SELECT * FROM checklist ORDER BY category ASC, id ASC").all();
        
        // Gộp chi phí vào từng điểm lịch trình tương ứng
        const timelineWithCosts = timeline.map(item => {
          item.costs = costs.filter(c => c.timeline_id === item.id);
          return item;
        });

        return jsonResponse({ timeline: timelineWithCosts, checklist });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 2. THÊM MỚI LỊCH TRÌNH VÀ CÁC CHI PHÍ ĐI KÈM
    if (request.method === "POST" && url.pathname === "/api/timeline") {
      try {
        const data = await request.json();
        
        // Chèn vào bảng timeline trước
        const info = await db.prepare(`
          INSERT INTO timeline (day_number, time_slot, location, location_zh, content, transport_guide, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.day_number, data.time_slot, data.location, data.location_zh,
          data.content, data.transport_guide, data.notes, data.status || "Chưa đi"
        ).run();

        const timelineId = info.meta.last_row_id;

        // Nếu có danh sách chi phí gửi lên, chèn vào bảng costs
        if (data.costs && data.costs.length > 0) {
          const stmt = db.prepare(`
            INSERT INTO costs (timeline_id, cost_name, category, amount, currency, cost_type)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const batch = data.costs.map(c => 
            stmt.bind(timelineId, c.cost_name, c.category, c.amount || 0, c.currency || 'CNY', c.cost_type || 'Dự kiến')
          );
          await db.batch(batch);
        }

        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 3. CẬP NHẬT LỊCH TRÌNH VÀ CHI PHÍ
    if (request.method === "PUT" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        const data = await request.json();

        // Cập nhật timeline
        await db.prepare(`
          UPDATE timeline 
          SET day_number = ?, time_slot = ?, location = ?, location_zh = ?, content = ?, transport_guide = ?, notes = ?, status = ?
          WHERE id = ?
        `).bind(
          data.day_number, data.time_slot, data.location, data.location_zh,
          data.content, data.transport_guide, data.notes, data.status, id
        ).run();

        // Xóa hết chi phí cũ của điểm này đi để nạp lại cái mới
        await db.prepare("DELETE FROM costs WHERE timeline_id = ?").bind(id).run();

        // Chèn lại đống chi phí mới cập nhật
        if (data.costs && data.costs.length > 0) {
          const stmt = db.prepare(`
            INSERT INTO costs (timeline_id, cost_name, category, amount, currency, cost_type)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          const batch = data.costs.map(c => 
            stmt.bind(id, c.cost_name, c.category, c.amount || 0, c.currency || 'CNY', c.cost_type || 'Dự kiến')
          );
          await db.batch(batch);
        }

        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 4. XÓA LỊCH TRÌNH (Tự động xóa sạch chi phí nhờ CASCADE)
    if (request.method === "DELETE" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM timeline WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 5. CÁC API CỦA HÀNH LÝ (GIỮ NGUYÊN)
    if (request.method === "POST" && url.pathname === "/api/checklist") {
      try {
        const data = await request.json();
        await db.prepare("INSERT INTO checklist (category, item_name, is_checked) VALUES (?, ?, 0)").bind(data.category, data.item_name).run();
        return jsonResponse({ success: true });
      } catch (err) { return jsonResponse({ error: err.message }, 500); }
    }

    if (request.method === "PUT" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        const data = await request.json();
        await db.prepare("UPDATE checklist SET is_checked = ? WHERE id = ?").bind(data.is_checked, id).run();
        return jsonResponse({ success: true });
      } catch (err) { return jsonResponse({ error: err.message }, 500); }
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM checklist WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      } catch (err) { return jsonResponse({ error: err.message }, 500); }
    }

    return env.ASSETS.fetch(request);
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json;charset=UTF-8" }
  });
}
