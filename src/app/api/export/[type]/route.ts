import { NextResponse } from "next/server";
import { getDashboardContext } from "@/lib/active-linktree";
import { csvCell as csv } from "@/lib/security";
import { dateInputValue, fetchProducts } from "@/lib/products";

export async function GET(_:Request,{params}:{params:Promise<{type:string}>}){const {type}=await params;const {supabase,linktree}=await getDashboardContext();let rows:string[][];let name:string;if(type==="insights"){
  // API Supabase membatasi baris per permintaan; ambil per 1000 sampai habis.
  const all=async(table:"page_views"|"link_clicks"|"product_clicks",columns:string)=>{const out:Record<string,string>[]=[];for(let from=0;from<200000;from+=1000){const {data}=await supabase.from(table).select(columns).eq("linktree_id",linktree.id).order("created_at").range(from,from+999);const page=(data??[]) as unknown as Record<string,string>[];out.push(...page);if(page.length<1000)break;}return out;};
  const [views,clicks,buys]=await Promise.all([all("page_views","created_at"),all("link_clicks","created_at"),all("product_clicks","platform,created_at")]);
  rows=[["Type","Store","Created at"],...views.map((item)=>["view","",item.created_at]),...clicks.map((item)=>["link click","",item.created_at]),...buys.map((item)=>["buy click",item.platform,item.created_at])];
  name="insights.csv";}else if(type==="products"){
  // Cadangan katalog; formatnya sama dengan Import CSV di halaman Products.
  const [products,{data:categories}]=await Promise.all([fetchProducts(supabase,linktree.id),supabase.from("shop_collections").select("id,title,position").eq("linktree_id",linktree.id).order("position")]);
  const order=new Map((categories??[]).map((item,index)=>[item.id as string,index]));const title=new Map((categories??[]).map((item)=>[item.id as string,String(item.title)]));
  const yes=(value:boolean)=>value?"yes":"no";
  rows=[["Number","Name","Link","Price","Original price","Category","Store","Visible","On sale","Show from","Until","Photo","Note"],...products.sort((a,b)=>(order.get(a.collection_id)??0)-(order.get(b.collection_id)??0)).map((item)=>[String(item.number??""),item.title,item.url,item.price,item.compare_price,title.get(item.collection_id)??"",item.platform,yes(item.is_active),yes(item.is_featured),dateInputValue(item.starts_at),dateInputValue(item.ends_at,true),item.image_url??"",item.note])];
  name="products.csv";}else return NextResponse.json({error:"Invalid export"},{status:404});return new NextResponse("\uFEFF"+rows.map((row)=>row.map(csv).join(",")).join("\n"),{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="${name}"`}});}
