export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB; // Binding tên là DB trong Cloudflare

    // RENDER FRONTEND
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(getHtmlContent(), {
        headers: { "Content-Type": "text/html;charset=UTF-8" }
      });
    }

    // --- API ENDPOINTS ---

    // 1. Lấy toàn bộ dữ liệu (Timeline + Checklist)
    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const { results: timeline } = await db.prepare("SELECT * FROM timeline ORDER BY day_number ASC, id ASC").all();
        const { results: checklist } = await db.prepare("SELECT * FROM checklist ORDER BY category ASC, id ASC").all();
        return jsonResponse({ timeline, checklist });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 2. Thêm mới một địa điểm/lịch trình
    if (request.method === "POST" && url.pathname === "/api/timeline") {
      try {
        const data = await request.json();
        await db.prepare(`
          INSERT INTO timeline (day_number, time_slot, location, location_zh, content, transport, cost_est, cost_real, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.day_number, data.time_slot, data.location, data.location_zh,
          data.content, data.transport, data.cost_est || 0, data.cost_real || 0,
          data.status || 'pending', data.notes
        ).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 3. Cập nhật một địa điểm (Sửa thông tin, đổi trạng thái, nhập tiền thực tế)
    if (request.method === "PUT" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        const data = await request.json();
        await db.prepare(`
          UPDATE timeline 
          SET day_number=?, time_slot=?, location=?, location_zh=?, content=?, transport=?, cost_est=?, cost_real=?, status=?, notes=?
          WHERE id=?
        `).bind(
          data.day_number, data.time_slot, data.location, data.location_zh,
          data.content, data.transport, data.cost_est, data.cost_real,
          data.status, data.notes, id
        ).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 4. Xóa một địa điểm khỏi Plan
    if (request.method === "DELETE" && url.pathname.startsWith("/api/timeline/")) {
      const id = url.pathname.split("/").pop();
      await db.prepare("DELETE FROM timeline WHERE id = ?").bind(id).run();
      return jsonResponse({ success: true });
    }

    // 5. Thêm món đồ vào Checklist
    if (request.method === "POST" && url.pathname === "/api/checklist") {
      const data = await request.json();
      await db.prepare("INSERT INTO checklist (category, item_name, is_checked) VALUES (?, ?, 0)")
              .bind(data.category, data.item_name).run();
      return jsonResponse({ success: true });
    }

    // 6. Check/Uncheck món đồ
    if (request.method === "PUT" && url.pathname.startsWith("/api/checklist/")) {
      const id = url.pathname.split("/").pop();
      const data = await request.json();
      await db.prepare("UPDATE checklist SET is_checked = ? WHERE id = ?").bind(data.is_checked, id).run();
      return jsonResponse({ success: true });
    }

    // 7. Xóa món đồ khỏi Checklist
    if (request.method === "DELETE" && url.pathname.startsWith("/api/checklist/")) {
      const id = url.pathname.split("/").pop();
      await db.prepare("DELETE FROM checklist WHERE id = ?").bind(id).run();
      return jsonResponse({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// Hàm này sẽ nhúng toàn bộ mã nguồn của file index.html vào để chạy tập trung
function getHtmlContent() {
  return ``; 
}
