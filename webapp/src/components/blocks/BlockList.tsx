import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { PageBlock, PageSlug } from '../../lib/types';
import { renderBlock } from './blockRegistry';
import { useRevealAnimations } from '../../lib/useRevealAnimations';

export function BlockList({ page }: { page: PageSlug }) {
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  useEffect(() => {
    api
      .get<PageBlock[]>(`/api/public/blocks?page=${page}`)
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [page]);

  useRevealAnimations([blocks]);

  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => (
        <div key={block.id} className="reveal">
          {renderBlock(block)}
        </div>
      ))}
    </>
  );
}
