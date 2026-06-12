export type PrizeId = 'hoodie' | 'cap' | 'tee'

export interface PrizeItem {
  rank: number
  id: PrizeId
  label: string
  title: string
  image: string
  accent: string
}

export const PRIZE_ITEMS: PrizeItem[] = [
  {
    rank: 1,
    id: 'hoodie',
    label: '1st',
    title: 'Basement hoodie',
    image: '/prizes/hoodie.png',
    accent: '#FFD700',
  },
  {
    rank: 2,
    id: 'tee',
    label: '2nd',
    title: 'Basement tee',
    image: '/prizes/tee-front.png',
    accent: '#C0C0C0',
  },
  {
    rank: 3,
    id: 'cap',
    label: '3rd',
    title: 'Basement bottle',
    image: '/prizes/cap.png',
    accent: '#CD7F32',
  },
]

export const PRIZES_BY_RANK = Object.fromEntries(
  PRIZE_ITEMS.map(item => [item.rank, { label: item.label, desc: item.title }]),
) as Record<number, { label: string; desc: string }>
