// src/app/embed-generator/page.tsx
import EmbedGenerator from '@/components/EmbedGenerator';

export const metadata = {
  title: 'Embed Widget Generator',
  description: 'Generate embeddable widgets for your website',
};

export default function EmbedGeneratorPage() {
  return (
    <main>
      <EmbedGenerator />
    </main>
  );
}