'use client'

import { useCallback, useEffect, useState } from 'react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MatchCard } from '@/components/match-card'
import type { Match } from '@/lib/wc2026-data'

type PredMap = Record<string, { home: number; away: number }>

function GroupHeader({ group }: { group: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        borderBottom: '1px solid var(--fg-4)',
        borderTop: '1px solid var(--fg-4)',
        background: 'rgba(235,235,235,0.02)',
      }}
    >
      <span
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--fg-1)',
          letterSpacing: '-0.02em',
        }}
      >
        GRUPO {group}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--fg-4)' }} />
    </div>
  )
}

interface GroupMatchesCarouselProps {
  groups: { group: string; matches: Match[] }[]
  currentGroupIndex: number
  onGroupIndexChange: (index: number) => void
  activeGroupMatchIndex: number
  focusToken: number
  predictions: PredMap
  onSave: (matchId: string, home: number, away: number) => Promise<void>
  now: Date
  userTz: string
  onGroupMatchComplete: (matchId: string) => void
  onGroupMatchActivate: (groupIndex: number, matchIndex: number) => void
  onApiReady: (api: CarouselApi) => void
}

export function GroupMatchesCarousel({
  groups,
  currentGroupIndex,
  onGroupIndexChange,
  activeGroupMatchIndex,
  focusToken,
  predictions,
  onSave,
  now,
  userTz,
  onGroupMatchComplete,
  onGroupMatchActivate,
  onApiReady,
}: GroupMatchesCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!carouselApi) return
    onApiReady(carouselApi)
  }, [carouselApi, onApiReady])

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => {
      onGroupIndexChange(carouselApi.selectedScrollSnap())
    }

    carouselApi.on('select', onSelect)
    onSelect()

    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi, onGroupIndexChange])

  useEffect(() => {
    if (!carouselApi) return
    if (carouselApi.selectedScrollSnap() === currentGroupIndex) return
    carouselApi.scrollTo(currentGroupIndex, false)
  }, [carouselApi, currentGroupIndex])

  const scrollToGroup = useCallback(
    (index: number) => {
      carouselApi?.scrollTo(index)
    },
    [carouselApi],
  )

  const currentGroup = groups[currentGroupIndex]

  return (
    <div className="w-full">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
          GRUPO {currentGroup?.group ?? '—'}
        </span>
        <span className="mono-label" style={{ color: 'var(--fg-2)' }}>
          {currentGroupIndex + 1} / {groups.length}
        </span>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{ align: 'start', loop: false, dragFree: false }}
        plugins={[WheelGesturesPlugin({ forceWheelAxis: 'x' })]}
        className="w-full touch-pan-y"
      >
        <CarouselContent className="ml-0">
          {groups.map((group, groupIndex) => (
            <CarouselItem key={group.group} className="basis-full pl-0">
              <GroupHeader group={group.group} />
              <div style={{ border: '1px solid var(--fg-4)', borderTop: 'none' }}>
                {group.matches.map((match, matchIndex) => {
                  const isGroupActive = groupIndex === currentGroupIndex
                  const isActive = isGroupActive && matchIndex === activeGroupMatchIndex

                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictions[match.id]}
                      onSave={onSave}
                      now={now}
                      userTz={userTz}
                      focused={isActive}
                      highlighted={isActive}
                      focusToken={isActive ? focusToken : 0}
                      saveWhenComplete={isActive}
                      onActivate={() => onGroupMatchActivate(groupIndex, matchIndex)}
                      onSaved={() => onGroupMatchComplete(match.id)}
                    />
                  )
                })}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <nav
        className="flex flex-wrap justify-center gap-2"
        style={{ margin: '24px 0' }}
        aria-label="Grupos"
      >
        {groups.map((group, index) => (
          <Button
            key={group.group}
            type="button"
            variant={index === currentGroupIndex ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'min-w-9 font-bold tabular-nums',
              index === currentGroupIndex && 'pointer-events-none',
            )}
            onClick={() => scrollToGroup(index)}
            aria-label={`Grupo ${group.group}`}
            aria-current={index === currentGroupIndex ? 'true' : undefined}
          >
            {group.group}
          </Button>
        ))}
      </nav>
    </div>
  )
}
