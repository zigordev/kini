import { notFound } from 'next/navigation';
import { PreviewGallery } from './PreviewGallery';

/**
 * Design-system preview — renders the shared primitives inside this app's
 * real stylesheet and theme, with no auth and no API.
 *
 * Exists because every screen that uses these primitives sits behind Google
 * OAuth, so there is otherwise no way to see a Button or StatTile rendered
 * in kini's own skin without a live session. Dev builds only: this 404s in
 * production, and AppShell's bypass for /dev/ is gated the same way.
 */
export default function DevPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <PreviewGallery />;
}
