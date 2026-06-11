'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { MatchCard } from '@/components/match-card'
import { cn } from '@/lib/utils'
import type { Match } from '@/lib/wc2026-data'

type PredMap = Record<string, { home: number; away: number }>

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
  const groupTabsRef = useRef<HTMLElement>(null)
  const syncingFromParentRef = useRef(false)

  const wheelPlugins = useMemo(() => [WheelGesturesPlugin()], [])

  useEffect(() => {
    if (!carouselApi) return
    onApiReady(carouselApi)
  }, [carouselApi, onApiReady])

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => {
      if (syncingFromParentRef.current) return
      onGroupIndexChange(carouselApi.selectedScrollSnap())
    }

    carouselApi.on('select', onSelect)

    return () => {
      carouselApi.off('select', onSelect)
    }
  }, [carouselApi, onGroupIndexChange])

  useEffect(() => {
    if (!carouselApi) return
    if (carouselApi.selectedScrollSnap() === currentGroupIndex) return

    syncingFromParentRef.current = true
    carouselApi.scrollTo(currentGroupIndex, false)
    window.setTimeout(() => {
      syncingFromParentRef.current = false
    }, 0)
  }, [carouselApi, currentGroupIndex])

  const scrollGroupTabIntoView = useCallback((index: number) => {
    const nav = groupTabsRef.current
    const tab = nav?.querySelector<HTMLElement>(`[data-group-tab="${index}"]`)
    if (!nav || !tab) return

    const targetLeft = tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2
    nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollGroupTabIntoView(currentGroupIndex)
  }, [currentGroupIndex, scrollGroupTabIntoView])

  const scrollToGroup = useCallback(
    (index: number) => {
      onGroupIndexChange(index)
      carouselApi?.scrollTo(index)
    },
    [carouselApi, onGroupIndexChange],
  )

  const currentGroup = groups[currentGroupIndex]

  return (
    <div className="w-full min-w-0">
      <div className="group-carousel-header">
        <h2 className="group-carousel-title">Group {currentGroup?.group ?? '—'}</h2>
        <span className="mono-label" style={{ color: 'var(--fg-2)', flexShrink: 0 }}>
          {currentGroupIndex + 1} / {groups.length}
        </span>
      </div>

      <Carousel
        setApi={setCarouselApi}
        opts={{ align: 'start', loop: false, containScroll: 'trimSnaps', watchDrag: true }}
        plugins={wheelPlugins}
        className="group-carousel-viewport"
      >
        <CarouselContent className="group-carousel-track ml-0">
          {groups.map((group, groupIndex) => (
            <CarouselItem
              key={group.group}
              className="group-carousel-slide basis-full pl-0"
            >
              <div className="w-full min-w-0" style={{ border: '1px solid var(--fg-4)' }}>
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

      <div className="group-tabs-wrap">
        <nav ref={groupTabsRef} className="group-tabs scrollbar-none" aria-label="Groups">
          {groups.map((group, index) => (
            <button
              key={group.group}
              type="button"
              data-group-tab={index}
              className={cn('group-tab', index === currentGroupIndex && 'is-active')}
              onClick={() => scrollToGroup(index)}
              aria-label={`Group ${group.group}`}
              aria-current={index === currentGroupIndex ? 'true' : undefined}
            >
              {group.group}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
