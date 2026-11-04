import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = { title: "Terms · LinkHub", description: "The rules for using LinkHub." };

export default function TermsPage() {
  return <LegalDoc title="Terms" updated="4 November 2026" intro="These are the rules for using LinkHub. By making an account you agree to them. They are written to be read, so they are short.">
    <h2>The service</h2>
    <p>LinkHub lets you make a page with your products, store links and other links. It is free, and there is no paid plan. You can have up to three pages per account.</p>

    <h2>Your account</h2>
    <ul>
      <li>Use an email address you can reach, and keep your password to yourself.</li>
      <li>You are responsible for what happens on your account. If you think someone else has signed in, change your password and turn on a code from an authenticator app in Account &amp; security.</li>
    </ul>

    <h2>Your page and what you sell</h2>
    <ul>
      <li>You are responsible for everything on your page: the products, prices, photos, links and text.</li>
      <li>Prices and stock on your page should match the store they link to, or be clearly out of date.</li>
      <li>If some links earn you a commission, say so on your page. A short footer note is enough.</li>
      <li>Only upload photos you have the right to use.</li>
    </ul>

    <h2>Not allowed</h2>
    <ul>
      <li>Selling or linking to illegal goods or services.</li>
      <li>Scams, fake shops, phishing, or links that install harmful software.</li>
      <li>Pretending to be another person, shop or brand.</li>
      <li>Content that harasses people or that you do not have the rights to.</li>
      <li>Trying to break into LinkHub or other people&rsquo;s accounts, or sending automated traffic to inflate numbers.</li>
    </ul>
    <p>We may hide content, take back a page address, or close an account that breaks these rules. Where we can, we will tell you why.</p>

    <h2>Sales happen in the store</h2>
    <p>LinkHub only shows your products and sends buyers to the store you linked. Orders, payment, shipping, returns and refunds are between the buyer, the seller and that store. LinkHub is not part of the sale.</p>

    <h2>No guarantees</h2>
    <p>We try to keep LinkHub running and your data safe, but the service is provided as it is. Pages may sometimes be slow or unavailable, and features may change. If we ever have to shut LinkHub down, we will give notice so you can move your links.</p>

    <h2>Leaving</h2>
    <p>You can delete your account at any time from Account &amp; security. It removes your pages and data permanently. See <Link href="/en/privacy">Privacy</Link> for what is stored.</p>

    <h2>Changes</h2>
    <p>If these terms change, we will update this page and the date at the top.</p>
  </LegalDoc>;
}
