"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { formatRupiah } from "@/lib/rupiah";
import type { Locale } from "@/lib/i18n";

type LinkCollection = { id: string; title: string };
type LinkItem = { id: string; collection_id: string | null; title: string; platform: string | null };
type ShopCollection = { id: string; title: string };
type Product = { id: string; collection_id: string; platform: string; title: string; url: string; price: string; image_url: string | null };
type Profile = { id:string; name: string; bio: string; avatar_url: string | null; title_style: string; button_style: string; button_roundness: string; custom_footer: string };

export function PublicProfileContent({ profile, linkCollections, links, shopCollections, products,locale }: { locale:Locale; profile: Profile; linkCollections: LinkCollection[]; links: LinkItem[]; shopCollections: ShopCollection[]; products: Product[] }) {
  const en=locale==="en";
  const [tab, setTab] = useState<"links" | "shop">("links");
  const [contactMessage,setContactMessage]=useState("");
  useEffect(()=>{ void fetch(`/api/view/${profile.id}`,{method:"POST"}); },[profile.id]);
  const buttonClass = `button-${profile.button_style} radius-${profile.button_roundness}`;
  async function submitContact(formData:FormData){const response=await fetch(`/api/contact/${profile.id}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:formData.get("name"),email:formData.get("email"),company:formData.get("company")})});const result=await response.json();setContactMessage(result.message??result.error??"Kontak gagal dikirim");}
  return <section className="public-profile">
    {profile.avatar_url ? <span className="preview-photo public-photo" role="img" aria-label={`${profile.name} profile`} style={{ backgroundImage: `url(${profile.avatar_url})` }} /> : <div className="avatar">{profile.name.slice(0, 1).toUpperCase() || "L"}</div>}
    <h1 className={`title-${profile.title_style}`}>{profile.name}</h1><p>{profile.bio}</p>
    <div className="preview-switch public-switch"><button className={tab === "links" ? "active" : ""} onClick={() => setTab("links")}>{en?"Links":"Tautan"}</button><button className={tab === "shop" ? "active" : ""} onClick={() => setTab("shop")}>{en?"Shop":"Toko"}</button></div>
    {tab === "links" ? <div className="public-links">{linkCollections.map((collection) => { const items = links.filter((item) => item.collection_id === collection.id); return items.length ? <section className="public-link-collection" key={collection.id}><h2>{collection.title}</h2>{items.map((item) => <a href={`/api/click/${item.id}`} key={item.id} rel="noopener noreferrer" target="_blank" className={buttonClass}><span className="public-link-title"><PlatformIcon platform={item.platform} />{item.title}</span><span>↗</span></a>)}</section> : null; })}</div> : <div className="public-products">{shopCollections.map((collection) => { const items = products.filter((item) => item.collection_id === collection.id); return items.length ? <details className="public-shop-group" open key={collection.id}><summary>{collection.title}</summary>{items.map((item) => <a href={item.url} target="_blank" rel="noopener noreferrer" className={buttonClass} key={item.id}>{item.image_url ? <span className="public-product-image" style={{ backgroundImage: `url(${item.image_url})` }} /> : <span className="public-product-icon"><PlatformIcon platform={item.platform} /></span>}<span><strong>{item.title}</strong>{item.price ? <small>{formatRupiah(item.price)}</small> : null}</span><b>↗</b></a>)}</details> : null; })}{!products.length ? <div className="preview-shop"><strong>{en?"No products yet":"Belum ada produk"}</strong><p>{en?"Products will appear here.":"Produk akan muncul di sini."}</p></div> : null}</div>}
    <form action={submitContact} className="public-contact"><h2>{en?"Contact me":"Hubungi saya"}</h2><input className="honeypot" name="company" tabIndex={-1} autoComplete="off"/><input name="name" maxLength={80} placeholder={en?"Name":"Nama"}/><input name="email" type="email" required placeholder="Email"/><button className={buttonClass}>{en?"Send contact":"Kirim kontak"}</button>{contactMessage?<small role="status">{contactMessage}</small>:null}</form>
    {profile.custom_footer ? <p className="public-custom-footer">{profile.custom_footer}</p> : null}
    <Link className="made-with" href="/">LinkHub by Trias</Link>
  </section>;
}




