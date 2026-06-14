
export async function onRequestGet(ctx){
 const db=ctx.env.DB;
 const timeline=(await db.prepare('select * from timeline order by day_number,time_slot').all()).results;
 const checklist=(await db.prepare('select * from checklist order by category,item_name').all()).results;
 return Response.json({timeline,checklist});
}
