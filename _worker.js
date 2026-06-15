export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const db = env.DB;

    // 1. Lấy toàn bộ dữ liệu lịch trình & hành lý
    if (request.method === "GET" && url.pathname === "/api/data") {
      try {
        const { results: timeline } = await db.prepare("SELECT * FROM timeline ORDER BY day_number ASC, time_slot ASC, id ASC").all();
        const { results: checklist } = await db.prepare("SELECT * FROM checklist ORDER BY category ASC, id ASC").all();
        return jsonResponse({ timeline, checklist });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 2. Thêm mới một điểm lịch trình
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

    // 3. Sửa/Cập nhật một điểm lịch trình (bao gồm cả update nhanh trạng thái)
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

    // 4. Xóa điểm lịch trình
    if (request.method === "DELETE" && url.pathname.startsWith("/api/timeline/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM timeline WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // 5. Thêm mới một món đồ hành lý
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

    // 6. Check/Uncheck đồ hành lý
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

    // 7. Xóa món đồ hành lý
    if (request.method === "DELETE" && url.pathname.startsWith("/api/checklist/")) {
      try {
        const id = url.pathname.split("/").pop();
        await db.prepare("DELETE FROM checklist WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true });
      } catch (err) {
        return jsonResponse({ error: err.message }, 500);
      }
    }

    // Nếu không khớp API nào, Cloudflare Pages sẽ tự động lôi file index.html ra để hiển thị nên bà không cần lo lắng nha!
    return new Response("Not Found", { status: 404 });
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json;charset=UTF-8" }
  });
}
