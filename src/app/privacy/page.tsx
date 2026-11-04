import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = { title: "Privacy · LinkHub", description: "What LinkHub stores about sellers and their visitors, and why." };

export default function PrivacyPage() {
  return <LegalDoc title="Privacy" updated="4 November 2026" intro="This page explains what LinkHub stores when you make a page, what it records about the people who visit it, and what you can do about it. LinkHub is free and does not sell or rent anyone's data.">
    <h2>If you have a LinkHub account</h2>
    <ul>
      <li><b>Sign-in details.</b> Your email address and password. The password is stored as a hash by our sign-in provider; nobody at LinkHub can read it.</li>
      <li><b>Your pages.</b> The name, address, bio, photo, design, links and products you add, including product photos you upload. All of this is public on your page, apart from links and products you turn off.</li>
      <li><b>Security settings.</b> Whether you use a code from an authenticator app. The secret behind the codes is stored by our sign-in provider.</li>
    </ul>

    <h2>If you visit a LinkHub page</h2>
    <p>We count visits and taps so the page owner can see what works. For this we store:</p>
    <ul>
      <li>that the page was opened, and when;</li>
      <li>which link or product was tapped, the store it leads to, and when.</li>
    </ul>
    <p>We do not store your name, IP address, location or device. To avoid counting the same visit twice, your browser keeps a random code for one day. To stop abuse, your IP address is turned into a one-way code and kept for at most one day.</p>
    <p>When you tap Buy, you leave LinkHub and go to the store, for example Shopee or Tokopedia. What happens there is covered by that store&rsquo;s own privacy policy.</p>

    <h2>Cookies</h2>
    <p>LinkHub only uses cookies it needs to work: one that keeps you signed in, one that remembers which of your pages you are editing, and the one-day visit code above. There are no advertising or tracking cookies.</p>

    <h2>Services we use</h2>
    <ul>
      <li><b>Supabase</b> stores the database, sign-in and uploaded photos.</li>
      <li><b>Vercel</b> hosts the website.</li>
      <li><b>Cloudflare Turnstile</b> checks that sign-up and sign-in forms are used by a person, not a bot.</li>
    </ul>
    <p>They process data only to run LinkHub. We do not send your data to advertisers or analytics companies.</p>

    <h2>What you can do</h2>
    <ul>
      <li>Change or remove anything on your page from the <Link href="/en/dashboard">dashboard</Link>.</li>
      <li>Download your visit and tap numbers as a spreadsheet from Insights.</li>
      <li>Delete one page, or your whole account, from Account &amp; security. Deleting your account removes your pages, products, photos and statistics. This cannot be undone.</li>
    </ul>

    <h2>Changes</h2>
    <p>If we change what we store, we will update this page and the date at the top.</p>
  </LegalDoc>;
}
