
export async function onRequestPost(ctx){
 const b=await ctx.request.json();
 await ctx.env.DB.prepare('insert into checklist(category,item_name,is_checked) values(?,?,0)')
 .bind(b.category,b.item_name).run();
 return Response.json({ok:true});
}
