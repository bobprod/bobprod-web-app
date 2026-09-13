import { Helmet } from 'react-helmet-async';

export default function LegalNotice() {
  return (
    <section className="mx-auto w-[min(680px,92vw)] py-24 text-sm leading-relaxed text-white/70">
      <Helmet>
        <title>Legal Notice — bobprod</title>
      </Helmet>
      <h1 className="font-display mb-6 text-3xl text-white">Legal Notice</h1>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">Site publisher</h2>
      <p className="mb-4">
        [Legal name / business name] — [Business address] — [Business registration number, e.g. SIRET or
        local equivalent] — [VAT number, if applicable].
        <br />
        Contact: [publisher email or phone].
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">Publication director</h2>
      <p className="mb-4">[Name of the person responsible for the site&apos;s publication].</p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">Hosting</h2>
      <p className="mb-4">
        This site is hosted by Hostinger — [Hostinger entity name, e.g. Hostinger International Ltd.] — [
        registered address] — [website / contact URL].
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">Intellectual property</h2>
      <p className="mb-4">
        All content on this site (text, images, music, logos) is the property of bobprod or used with
        permission and may not be reproduced without prior written consent.
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">Contact</h2>
      <p className="mb-4">For any legal request regarding this site, contact us through the booking form.</p>

      <p className="mt-10 text-xs text-white/40">
        Placeholder notice: the bracketed fields above must be filled in with real business identity details
        before this site goes live — this page is a legal requirement in several jurisdictions (e.g. France&apos;s
        &quot;mentions légales&quot;).
      </p>
    </section>
  );
}
