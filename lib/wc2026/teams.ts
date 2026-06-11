import type { Team } from '@/lib/wc2026/types'

export const TEAMS: Record<string, Team> = {
  MEX: { code: 'MEX', name: 'Mexico', flag: '#006847,#FFFFFF,#CE1126' },
  RSA: { code: 'RSA', name: 'South Africa', flag: '#007A4D,#FFB81C,#001489' },
  KOR: { code: 'KOR', name: 'South Korea', flag: '#CD2E3A,#FFFFFF,#003478' },
  CZE: { code: 'CZE', name: 'Czech Republic', flag: '#11457E,#FFFFFF,#D7141A' },
  CAN: { code: 'CAN', name: 'Canada', flag: '#FF0000,#FFFFFF,#FF0000' },
  BIH: { code: 'BIH', name: 'Bosnia and Herzegovina', flag: '#002395,#FECB00,#002395' },
  QAT: { code: 'QAT', name: 'Qatar', flag: '#8D1B3D,#FFFFFF,#8D1B3D' },
  SUI: { code: 'SUI', name: 'Switzerland', flag: '#D52B1E,#FFFFFF,#D52B1E' },
  BRA: { code: 'BRA', name: 'Brazil', flag: '#009C3B,#FFDF00,#002776' },
  MAR: { code: 'MAR', name: 'Morocco', flag: '#006233,#C1272D,#006233' },
  HAI: { code: 'HAI', name: 'Haiti', flag: '#00209F,#D21034,#00209F' },
  SCO: { code: 'SCO', name: 'Scotland', flag: '#005EB8,#FFFFFF,#005EB8' },
  USA: { code: 'USA', name: 'United States', flag: '#B22234,#FFFFFF,#3C3B6E' },
  PAR: { code: 'PAR', name: 'Paraguay', flag: '#D52B1E,#FFFFFF,#0038A8' },
  AUS: { code: 'AUS', name: 'Australia', flag: '#00008B,#FFFFFF,#FF0000' },
  TUR: { code: 'TUR', name: 'Turkiye', flag: '#E30A17,#FFFFFF,#E30A17' },
  GER: { code: 'GER', name: 'Germany', flag: '#000000,#DD0000,#FFCE00' },
  CUW: { code: 'CUW', name: 'Curacao', flag: '#002B7F,#F7D417,#002B7F' },
  CIV: { code: 'CIV', name: 'Ivory Coast', flag: '#F77F00,#FFFFFF,#009E60' },
  ECU: { code: 'ECU', name: 'Ecuador', flag: '#FCD116,#003087,#CE1126' },
  NED: { code: 'NED', name: 'Netherlands', flag: '#AE1C28,#FFFFFF,#21468B' },
  JPN: { code: 'JPN', name: 'Japan', flag: '#FFFFFF,#BC002D,#FFFFFF' },
  SWE: { code: 'SWE', name: 'Sweden', flag: '#006AA7,#FECC00,#006AA7' },
  TUN: { code: 'TUN', name: 'Tunisia', flag: '#E70013,#FFFFFF,#E70013' },
  BEL: { code: 'BEL', name: 'Belgium', flag: '#000000,#FFDD00,#FF0000' },
  EGY: { code: 'EGY', name: 'Egypt', flag: '#CE1126,#FFFFFF,#000000' },
  IRN: { code: 'IRN', name: 'Iran', flag: '#239F40,#FFFFFF,#DA0000' },
  NZL: { code: 'NZL', name: 'New Zealand', flag: '#00247D,#FFFFFF,#CC0000' },
  ESP: { code: 'ESP', name: 'Spain', flag: '#AA151B,#F1BF00,#AA151B' },
  CPV: { code: 'CPV', name: 'Cape Verde', flag: '#003893,#FFFFFF,#003893' },
  KSA: { code: 'KSA', name: 'Saudi Arabia', flag: '#006C35,#FFFFFF,#006C35' },
  URU: { code: 'URU', name: 'Uruguay', flag: '#75AADB,#FFFFFF,#75AADB' },
  FRA: { code: 'FRA', name: 'France', flag: '#002395,#FFFFFF,#ED2939' },
  SEN: { code: 'SEN', name: 'Senegal', flag: '#00853F,#FDEF42,#E31B23' },
  IRQ: { code: 'IRQ', name: 'Iraq', flag: '#CE1126,#FFFFFF,#007A3D' },
  NOR: { code: 'NOR', name: 'Norway', flag: '#BA0C2F,#FFFFFF,#00205B' },
  ARG: { code: 'ARG', name: 'Argentina', flag: '#74ACDF,#FFFFFF,#74ACDF' },
  ALG: { code: 'ALG', name: 'Algeria', flag: '#006233,#FFFFFF,#D21034' },
  AUT: { code: 'AUT', name: 'Austria', flag: '#ED2939,#FFFFFF,#ED2939' },
  JOR: { code: 'JOR', name: 'Jordan', flag: '#007A3D,#FFFFFF,#000000' },
  POR: { code: 'POR', name: 'Portugal', flag: '#006600,#FF0000,#006600' },
  COD: { code: 'COD', name: 'DR Congo', flag: '#007FFF,#F7D618,#CE1021' },
  UZB: { code: 'UZB', name: 'Uzbekistan', flag: '#1EB53A,#FFFFFF,#0099B5' },
  COL: { code: 'COL', name: 'Colombia', flag: '#FCD116,#003087,#CE1126' },
  ENG: { code: 'ENG', name: 'England', flag: '#CF142B,#FFFFFF,#CF142B' },
  CRO: { code: 'CRO', name: 'Croatia', flag: '#FF0000,#FFFFFF,#0000CC' },
  GHA: { code: 'GHA', name: 'Ghana', flag: '#006B3F,#FCD116,#CE1126' },
  PAN: { code: 'PAN', name: 'Panama', flag: '#005293,#FFFFFF,#DA121A' },
}

/** Grupo fijo post-sorteo — la API no trae la letra en cada fixture. */
export const TEAM_TO_GROUP: Record<string, string> = {
  MEX: 'A', RSA: 'A', KOR: 'A', CZE: 'A',
  CAN: 'B', BIH: 'B', QAT: 'B', SUI: 'B',
  BRA: 'C', MAR: 'C', HAI: 'C', SCO: 'C',
  USA: 'D', PAR: 'D', AUS: 'D', TUR: 'D',
  GER: 'E', CUW: 'E', CIV: 'E', ECU: 'E',
  NED: 'F', JPN: 'F', SWE: 'F', TUN: 'F',
  BEL: 'G', EGY: 'G', IRN: 'G', NZL: 'G',
  ESP: 'H', CPV: 'H', KSA: 'H', URU: 'H',
  FRA: 'I', SEN: 'I', IRQ: 'I', NOR: 'I',
  ARG: 'J', ALG: 'J', AUT: 'J', JOR: 'J',
  POR: 'K', COD: 'K', UZB: 'K', COL: 'K',
  ENG: 'L', CRO: 'L', GHA: 'L', PAN: 'L',
}

const API_CODE_ALIASES: Record<string, string> = {
  ZAF: 'RSA',
  KOR: 'KOR',
  CZE: 'CZE',
  CZECH: 'CZE',
  CIV: 'CIV',
  CUW: 'CUW',
  CPV: 'CPV',
  COD: 'COD',
  CON: 'COD',
  TUR: 'TUR',
  IRN: 'IRN',
  IRQ: 'IRQ',
}

const NAME_TO_CODE: Record<string, string> = {
  'Mexico': 'MEX',
  'South Africa': 'RSA',
  'Korea Republic': 'KOR',
  'South Korea': 'KOR',
  'Czechia': 'CZE',
  'Czech Republic': 'CZE',
  'Canada': 'CAN',
  'Bosnia and Herzegovina': 'BIH',
  'Qatar': 'QAT',
  'Switzerland': 'SUI',
  'Brazil': 'BRA',
  'Morocco': 'MAR',
  'Haiti': 'HAI',
  'Scotland': 'SCO',
  'USA': 'USA',
  'United States': 'USA',
  'Paraguay': 'PAR',
  'Australia': 'AUS',
  'Turkiye': 'TUR',
  'Germany': 'GER',
  'Curacao': 'CUW',
  'Curaçao': 'CUW',
  'Côte d\'Ivoire': 'CIV',
  'Ivory Coast': 'CIV',
  'Ecuador': 'ECU',
  'Netherlands': 'NED',
  'Japan': 'JPN',
  'Sweden': 'SWE',
  'Tunisia': 'TUN',
  'Belgium': 'BEL',
  'Egypt': 'EGY',
  'Iran': 'IRN',
  'IR Iran': 'IRN',
  'New Zealand': 'NZL',
  'Spain': 'ESP',
  'Cabo Verde': 'CPV',
  'Cape Verde': 'CPV',
  'Saudi Arabia': 'KSA',
  'Uruguay': 'URU',
  'France': 'FRA',
  'Senegal': 'SEN',
  'Iraq': 'IRQ',
  'Norway': 'NOR',
  'Argentina': 'ARG',
  'Algeria': 'ALG',
  'Austria': 'AUT',
  'Jordan': 'JOR',
  'Portugal': 'POR',
  'Congo DR': 'COD',
  'DR Congo': 'COD',
  'Democratic Republic of the Congo': 'COD',
  'Uzbekistan': 'UZB',
  'Colombia': 'COL',
  'England': 'ENG',
  'Croatia': 'CRO',
  'Ghana': 'GHA',
  'Panama': 'PAN',
}

export function normalizeTeamCode(code: string | null, name: string): string {
  const fromCode = code?.trim().toUpperCase()
  if (fromCode && TEAMS[fromCode]) return fromCode
  if (fromCode && API_CODE_ALIASES[fromCode]) return API_CODE_ALIASES[fromCode]

  const fromName = NAME_TO_CODE[name]
  if (fromName) return fromName

  return fromCode ?? name.slice(0, 3).toUpperCase()
}

export function resolveTeam(code: string | null, name: string): Team {
  const normalized = normalizeTeamCode(code, name)
  return TEAMS[normalized] ?? {
    code: normalized,
    name,
    flag: '#333333,#666666,#999999',
  }
}

export function resolveGroup(homeCode: string, awayCode: string): string {
  return TEAM_TO_GROUP[homeCode] ?? TEAM_TO_GROUP[awayCode] ?? '?'
}
