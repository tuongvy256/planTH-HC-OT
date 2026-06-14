export default {

    async fetch(request, env) {

        const url = new URL(request.url);
        const path = url.pathname;

        try {

            // =========================
            // GET ALL DATA
            // =========================

            if (
                request.method === 'GET' &&
                path === '/api/data'
            ) {

                const timeline = await env.DB
                    .prepare(`
                        SELECT *
                        FROM timeline
                        ORDER BY day_number,
                                 time_slot
                    `)
                    .all();

                const checklist = await env.DB
                    .prepare(`
                        SELECT *
                        FROM checklist
                        ORDER BY category,
                                 item_name
                    `)
                    .all();

                return json({
                    success: true,
                    timeline: timeline.results || [],
                    checklist: checklist.results || []
                });

            }

            // =========================
            // ADD TIMELINE
            // =========================

            if (
                request.method === 'POST' &&
                path === '/api/timeline'
            ) {

                const body = await request.json();

                await env.DB.prepare(`
                    INSERT INTO timeline
                    (
                        day_number,
                        time_slot,
                        location,
                        location_zh,
                        content,
                        transport,
                        cost_est,
                        cost_real,
                        notes,
                        status
                    )
                    VALUES
                    (
                        ?,?,?,?,?,?,?,?,?,?
                    )
                `)
                .bind(
                    body.day_number,
                    body.time_slot,
                    body.location,
                    body.location_zh,
                    body.content,
                    body.transport,
                    body.cost_est || 0,
                    body.cost_real || 0,
                    body.notes,
                    'Chưa đi'
                )
                .run();

                return json({
                    success: true
                });

            }

            // =========================
            // ADD CHECKLIST
            // =========================

            if (
                request.method === 'POST' &&
                path === '/api/checklist'
            ) {

                const body = await request.json();

                await env.DB.prepare(`
                    INSERT INTO checklist
                    (
                        category,
                        item_name,
                        is_checked
                    )
                    VALUES
                    (
                        ?, ?, 0
                    )
                `)
                .bind(
                    body.category,
                    body.item_name
                )
                .run();

                return json({
                    success: true
                });

            }
// =========================
// ADD CHECKLIST
// =========================

if (
    request.method === 'POST' &&
    path === '/api/checklist'
) {

    const body = await request.json();

    await env.DB.prepare(`
        INSERT INTO checklist
        (
            category,
            item_name,
            is_checked
        )
        VALUES
        (
            ?, ?, 0
        )
    `)
    .bind(
        body.category,
        body.item_name
    )
    .run();

    return json({
        success: true
    });

}

return new Response(
    'Not Found',
    {
        status: 404
    }
);
            return new Response(
                'Not Found',
                {
                    status: 404
                }
            );

        }
        catch (err) {

            return json({
                success: false,
                error: err.message
            });

        }

    }

};

function json(data) {

    return new Response(
        JSON.stringify(data),
        {
            headers: {
                'Content-Type':
                'application/json;charset=UTF-8'
            }
        }
    );

}
