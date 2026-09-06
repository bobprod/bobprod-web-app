import type { JSX } from 'react';
import type {
  CustomHtmlConfig,
  MerchGridConfig,
  NewsletterSignupConfig,
  PageBlock,
  PressQuotesConfig,
  TestimonialsConfig,
  UpcomingShowsConfig,
} from '../../lib/types';
import { NewsletterSignupBlock } from './NewsletterSignupBlock';
import { MerchGridBlock } from './MerchGridBlock';
import { TestimonialsBlock } from './TestimonialsBlock';
import { PressQuotesBlock } from './PressQuotesBlock';
import { UpcomingShowsBlock } from './UpcomingShowsBlock';
import { CustomHtmlBlock } from './CustomHtmlBlock';

/**
 * Renders one block by type. An unrecognized blockType (e.g. from a newer app version reading an
 * older DB, or vice versa) renders nothing for that one block rather than throwing — defensive
 * rendering per docs/architecture/content-blocks.md.
 */
export function renderBlock(block: PageBlock): JSX.Element | null {
  switch (block.blockType) {
    case 'newsletter_signup':
      return <NewsletterSignupBlock config={block.config as NewsletterSignupConfig} />;
    case 'merch_grid':
      return <MerchGridBlock config={block.config as unknown as MerchGridConfig} />;
    case 'testimonials':
      return <TestimonialsBlock config={block.config as unknown as TestimonialsConfig} />;
    case 'press_quotes':
      return <PressQuotesBlock config={block.config as unknown as PressQuotesConfig} />;
    case 'upcoming_shows':
      return <UpcomingShowsBlock config={block.config as unknown as UpcomingShowsConfig} />;
    case 'custom_html':
      return <CustomHtmlBlock config={block.config as unknown as CustomHtmlConfig} />;
    default:
      return null;
  }
}
