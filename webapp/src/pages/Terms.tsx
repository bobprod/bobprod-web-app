import { Helmet } from 'react-helmet-async';

export default function Terms() {
  return (
    <section className="mx-auto w-[min(680px,92vw)] py-24 text-sm leading-relaxed text-white/70">
      <Helmet>
        <title>Terms of Service — bobprod</title>
      </Helmet>
      <h1 className="font-display mb-6 text-3xl text-white">Terms of Service</h1>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">1. Site usage</h2>
      <p className="mb-4">
        This site is published to share music, tour dates, and biography information for the artist bobprod,
        and to let visitors submit booking requests. By using this site you agree to use it only for its
        intended purpose and not to attempt to disrupt, scrape, or misuse it.
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">2. Booking requests</h2>
      <p className="mb-4">
        Submitting a booking request through the contact form does not constitute a confirmed booking. A
        booking is only confirmed once you receive explicit written confirmation. Event details, fees, and
        availability are subject to change until confirmation.
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">3. Content and intellectual property</h2>
      <p className="mb-4">
        All music, images, logos, and other content on this site are the property of bobprod or used with
        permission, and are protected by applicable copyright law. You may not reproduce, redistribute, or
        commercially exploit this content without prior written consent.
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">4. Liability</h2>
      <p className="mb-4">
        This site and its content are provided "as is". While we aim to keep information (tour dates, links,
        availability) accurate and current, we cannot guarantee it is free of errors or always up to date, and
        we are not liable for decisions made based on outdated information.
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">5. Changes</h2>
      <p className="mb-4">
        These terms may be updated from time to time. Continued use of the site after changes are published
        constitutes acceptance of the updated terms.
      </p>

      <h2 className="font-display mb-2 mt-8 text-lg text-white">6. Contact</h2>
      <p className="mb-4">For any question about these terms, contact us through the booking form.</p>
    </section>
  );
}
