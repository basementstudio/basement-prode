'use client'

import dynamic from 'next/dynamic'
import { PRIZE_ITEMS } from '@/lib/prizes'
import { cn } from '@/lib/utils'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const PrizeViewer = dynamic(
  () => import('./prize-viewer').then(mod => mod.PrizeViewer),
  {
    ssr: false,
    loading: () => (
      <div className="prize-viewer prize-viewer-fallback" aria-hidden>
        <div className="prize-viewer-fallback-shimmer" />
      </div>
    ),
  },
)

function PrizeCard({ rank }: { rank: number }) {
  const prize = PRIZE_ITEMS.find(item => item.rank === rank)
  if (!prize) return null

  const colorClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'

  return (
    <article className={cn('prize-card', `prize-card-${colorClass}`)}>
      <div className={cn('prize-card-rank', 'mono-label', `podium-rank ${colorClass}`)}>
        {prize.label} — {prize.title.toUpperCase()}
      </div>
      <PrizeViewer prize={prize} />
      <p className="prize-card-hint mono-label">
        {prize.id === 'hoodie'
          ? 'Heavyweight fleece'
          : prize.id === 'cap'
            ? 'Holographic brim sticker'
            : 'Drag to rotate · scroll to zoom'}
      </p>
    </article>
  )
}

export function PrizeShowcase() {
  return (
    <section className="prize-showcase" aria-label="Pool prizes">
      <div className="mono-label prize-showcase-eyebrow">— PRIZES</div>
      <p className="prize-showcase-copy">
        Top three in the pool take home Basement merch. 
      </p>

      <div className="prize-showcase-desktop">
        {PRIZE_ITEMS.map(prize => (
          <PrizeCard key={prize.id} rank={prize.rank} />
        ))}
      </div>

      <div className="prize-showcase-mobile">
        <Carousel opts={{ align: 'start', loop: true }} className="prize-carousel">
          <CarouselContent>
            {PRIZE_ITEMS.map(prize => (
              <CarouselItem key={prize.id} className="prize-carousel-item">
                <PrizeCard rank={prize.rank} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="prize-carousel-nav prize-carousel-prev" />
          <CarouselNext className="prize-carousel-nav prize-carousel-next" />
        </Carousel>
      </div>
    </section>
  )
}
