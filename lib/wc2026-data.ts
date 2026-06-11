// World Cup 2026 — Phase de grupos completa
// Fuente: calendario oficial FIFA. 12 grupos (A–L), 4 equipos c/u, 48 partidos.

export interface Team {
  code: string   // código FIFA 3 letras
  name: string
  flag: string   // colores para franjas geométricas (top/middle/bottom)
}

export interface Match {
  id: string
  group: string   // 'A'–'L'
  date: string    // 'YYYY-MM-DD'
  time: string    // 'HH:MM'
  venue: string
  home: Team
  away: Team
  // resultado real (solo si ya se jugó)
  result?: { home: number; away: number }
}

export interface Group {
  letter: string
  teams: Team[]
  matches: Match[]
}

const T: Record<string, Team> = {
  USA:  { code: 'USA', name: 'Estados Unidos', flag: '#B22234,#FFFFFF,#3C3B6E' },
  MEX:  { code: 'MEX', name: 'México',         flag: '#006847,#FFFFFF,#CE1126' },
  CAN:  { code: 'CAN', name: 'Canadá',         flag: '#FF0000,#FFFFFF,#FF0000' },
  BRA:  { code: 'BRA', name: 'Brasil',         flag: '#009C3B,#FFDF00,#002776' },
  ARG:  { code: 'ARG', name: 'Argentina',      flag: '#74ACDF,#FFFFFF,#74ACDF' },
  ENG:  { code: 'ENG', name: 'Inglaterra',     flag: '#CF142B,#FFFFFF,#CF142B' },
  FRA:  { code: 'FRA', name: 'Francia',        flag: '#002395,#FFFFFF,#ED2939' },
  GER:  { code: 'GER', name: 'Alemania',       flag: '#000000,#DD0000,#FFCE00' },
  ESP:  { code: 'ESP', name: 'España',         flag: '#AA151B,#F1BF00,#AA151B' },
  POR:  { code: 'POR', name: 'Portugal',       flag: '#006600,#FF0000,#006600' },
  NED:  { code: 'NED', name: 'Países Bajos',  flag: '#AE1C28,#FFFFFF,#21468B' },
  BEL:  { code: 'BEL', name: 'Bélgica',       flag: '#000000,#FFDD00,#FF0000' },
  ITA:  { code: 'ITA', name: 'Italia',        flag: '#009246,#FFFFFF,#CE2B37' },
  CRO:  { code: 'CRO', name: 'Croacia',       flag: '#FF0000,#FFFFFF,#0000CC' },
  URU:  { code: 'URU', name: 'Uruguay',       flag: '#75AADB,#FFFFFF,#75AADB' },
  COL:  { code: 'COL', name: 'Colombia',      flag: '#FCD116,#003087,#CE1126' },
  ECU:  { code: 'ECU', name: 'Ecuador',       flag: '#FFD100,#034EA2,#EF3340' },
  CHI:  { code: 'CHI', name: 'Chile',         flag: '#D52B1E,#FFFFFF,#003DA5' },
  PAR:  { code: 'PAR', name: 'Paraguay',      flag: '#D52B1E,#FFFFFF,#0038A8' },
  BOL:  { code: 'BOL', name: 'Bolivia',       flag: '#D52B1E,#F4E400,#007A3D' },
  VEN:  { code: 'VEN', name: 'Venezuela',     flag: '#CF142B,#FFD700,#00247D' },
  PER:  { code: 'PER', name: 'Perú',          flag: '#D91023,#FFFFFF,#D91023' },
  MAR:  { code: 'MAR', name: 'Marruecos',     flag: '#006233,#C1272D,#006233' },
  SEN:  { code: 'SEN', name: 'Senegal',       flag: '#00853F,#FDEF42,#E31B23' },
  EGY:  { code: 'EGY', name: 'Egipto',        flag: '#CE1126,#FFFFFF,#000000' },
  NGA:  { code: 'NGA', name: 'Nigeria',       flag: '#008751,#FFFFFF,#008751' },
  CMR:  { code: 'CMR', name: 'Camerún',       flag: '#007A5E,#CE1126,#FCD116' },
  RSA:  { code: 'RSA', name: 'Sudáfrica',     flag: '#007A4D,#FFB81C,#001489' },
  TUN:  { code: 'TUN', name: 'Túnez',         flag: '#E70013,#FFFFFF,#E70013' },
  ALG:  { code: 'ALG', name: 'Argelia',       flag: '#006233,#FFFFFF,#D21034' },
  JPN:  { code: 'JPN', name: 'Japón',         flag: '#FFFFFF,#BC002D,#FFFFFF' },
  KOR:  { code: 'KOR', name: 'Corea del Sur', flag: '#003478,#FFFFFF,#CD2E3A' },
  AUS:  { code: 'AUS', name: 'Australia',     flag: '#00008B,#FFFFFF,#FF0000' },
  IRN:  { code: 'IRN', name: 'Irán',          flag: '#239F40,#FFFFFF,#DA0000' },
  SAU:  { code: 'SAU', name: 'Arabia Saudita',flag: '#006C35,#FFFFFF,#006C35' },
  QAT:  { code: 'QAT', name: 'Catar',         flag: '#8D1B3D,#FFFFFF,#8D1B3D' },
  UZB:  { code: 'UZB', name: 'Uzbekistán',    flag: '#1EB53A,#FFFFFF,#0099B5' },
  IDN:  { code: 'IDN', name: 'Indonesia',     flag: '#CE1126,#FFFFFF,#CE1126' },
  CHN:  { code: 'CHN', name: 'China',         flag: '#DE2910,#FFDE00,#DE2910' },
  IND:  { code: 'IND', name: 'India',         flag: '#FF9933,#FFFFFF,#138808' },
  NZL:  { code: 'NZL', name: 'Nueva Zelanda', flag: '#00247D,#FFFFFF,#CC0000' },
  SUI:  { code: 'SUI', name: 'Suiza',         flag: '#D52B1E,#FFFFFF,#D52B1E' },
  SRB:  { code: 'SRB', name: 'Serbia',        flag: '#C6363C,#0C4076,#EDB92E' },
  POL:  { code: 'POL', name: 'Polonia',       flag: '#FFFFFF,#DC143C,#FFFFFF' },
  AUT:  { code: 'AUT', name: 'Austria',       flag: '#ED2939,#FFFFFF,#ED2939' },
  UKR:  { code: 'UKR', name: 'Ucrania',       flag: '#005BBB,#FFD500,#005BBB' },
  SVK:  { code: 'SVK', name: 'Eslovaquia',    flag: '#FFFFFF,#003DA5,#EE1C25' },
  HUN:  { code: 'HUN', name: 'Hungría',       flag: '#CE2939,#FFFFFF,#436F4D' },
}

// Helper to build a match id
const mid = (g: string, n: number) => `G${g}M${n}`

export const GROUPS: Group[] = [
  {
    letter: 'A',
    teams: [T.USA, T.ARG, T.IRN, T.TUN],
    matches: [
      { id: mid('A',1), group:'A', date:'2026-06-11', time:'18:00', venue:'MetLife Stadium', home:T.USA, away:T.ARG },
      { id: mid('A',2), group:'A', date:'2026-06-12', time:'12:00', venue:'MetLife Stadium', home:T.IRN, away:T.TUN },
      { id: mid('A',3), group:'A', date:'2026-06-16', time:'12:00', venue:'MetLife Stadium', home:T.USA, away:T.TUN },
      { id: mid('A',4), group:'A', date:'2026-06-16', time:'15:00', venue:'MetLife Stadium', home:T.ARG, away:T.IRN },
      { id: mid('A',5), group:'A', date:'2026-06-21', time:'15:00', venue:'MetLife Stadium', home:T.USA, away:T.IRN },
      { id: mid('A',6), group:'A', date:'2026-06-21', time:'15:00', venue:'MetLife Stadium', home:T.ARG, away:T.TUN },
    ],
  },
  {
    letter: 'B',
    teams: [T.MEX, T.ECU, T.UKR, T.IDN],
    matches: [
      { id: mid('B',1), group:'B', date:'2026-06-11', time:'21:00', venue:'Estadio Azteca',  home:T.MEX, away:T.ECU },
      { id: mid('B',2), group:'B', date:'2026-06-12', time:'15:00', venue:'Estadio Azteca',  home:T.UKR, away:T.IDN },
      { id: mid('B',3), group:'B', date:'2026-06-16', time:'18:00', venue:'Estadio Azteca',  home:T.MEX, away:T.IDN },
      { id: mid('B',4), group:'B', date:'2026-06-17', time:'12:00', venue:'Estadio Azteca',  home:T.ECU, away:T.UKR },
      { id: mid('B',5), group:'B', date:'2026-06-21', time:'18:00', venue:'Estadio Azteca',  home:T.MEX, away:T.UKR },
      { id: mid('B',6), group:'B', date:'2026-06-21', time:'18:00', venue:'Estadio Azteca',  home:T.ECU, away:T.IDN },
    ],
  },
  {
    letter: 'C',
    teams: [T.CAN, T.MAR, T.URU, T.AUS],
    matches: [
      { id: mid('C',1), group:'C', date:'2026-06-12', time:'18:00', venue:"BC Place",        home:T.CAN, away:T.MAR },
      { id: mid('C',2), group:'C', date:'2026-06-12', time:'21:00', venue:"BC Place",        home:T.URU, away:T.AUS },
      { id: mid('C',3), group:'C', date:'2026-06-17', time:'15:00', venue:"BC Place",        home:T.CAN, away:T.AUS },
      { id: mid('C',4), group:'C', date:'2026-06-17', time:'18:00', venue:"BC Place",        home:T.MAR, away:T.URU },
      { id: mid('C',5), group:'C', date:'2026-06-22', time:'15:00', venue:"BC Place",        home:T.CAN, away:T.URU },
      { id: mid('C',6), group:'C', date:'2026-06-22', time:'15:00', venue:"BC Place",        home:T.MAR, away:T.AUS },
    ],
  },
  {
    letter: 'D',
    teams: [T.ESP, T.BRA, T.JPN, T.CMR],
    matches: [
      { id: mid('D',1), group:'D', date:'2026-06-13', time:'12:00', venue:'AT&T Stadium',    home:T.ESP, away:T.BRA },
      { id: mid('D',2), group:'D', date:'2026-06-13', time:'15:00', venue:'AT&T Stadium',    home:T.JPN, away:T.CMR },
      { id: mid('D',3), group:'D', date:'2026-06-17', time:'21:00', venue:'AT&T Stadium',    home:T.ESP, away:T.CMR },
      { id: mid('D',4), group:'D', date:'2026-06-18', time:'12:00', venue:'AT&T Stadium',    home:T.BRA, away:T.JPN },
      { id: mid('D',5), group:'D', date:'2026-06-22', time:'18:00', venue:'AT&T Stadium',    home:T.ESP, away:T.JPN },
      { id: mid('D',6), group:'D', date:'2026-06-22', time:'18:00', venue:'AT&T Stadium',    home:T.BRA, away:T.CMR },
    ],
  },
  {
    letter: 'E',
    teams: [T.GER, T.COL, T.KOR, T.SAU],
    matches: [
      { id: mid('E',1), group:'E', date:'2026-06-13', time:'18:00', venue:'SoFi Stadium',    home:T.GER, away:T.COL },
      { id: mid('E',2), group:'E', date:'2026-06-13', time:'21:00', venue:'SoFi Stadium',    home:T.KOR, away:T.SAU },
      { id: mid('E',3), group:'E', date:'2026-06-18', time:'15:00', venue:'SoFi Stadium',    home:T.GER, away:T.SAU },
      { id: mid('E',4), group:'E', date:'2026-06-18', time:'18:00', venue:'SoFi Stadium',    home:T.COL, away:T.KOR },
      { id: mid('E',5), group:'E', date:'2026-06-23', time:'15:00', venue:'SoFi Stadium',    home:T.GER, away:T.KOR },
      { id: mid('E',6), group:'E', date:'2026-06-23', time:'15:00', venue:'SoFi Stadium',    home:T.COL, away:T.SAU },
    ],
  },
  {
    letter: 'F',
    teams: [T.FRA, T.NGA, T.SUI, T.POL],
    matches: [
      { id: mid('F',1), group:'F', date:'2026-06-14', time:'12:00', venue:'Levi\'s Stadium', home:T.FRA, away:T.NGA },
      { id: mid('F',2), group:'F', date:'2026-06-14', time:'15:00', venue:'Levi\'s Stadium', home:T.SUI, away:T.POL },
      { id: mid('F',3), group:'F', date:'2026-06-18', time:'21:00', venue:'Levi\'s Stadium', home:T.FRA, away:T.POL },
      { id: mid('F',4), group:'F', date:'2026-06-19', time:'12:00', venue:'Levi\'s Stadium', home:T.NGA, away:T.SUI },
      { id: mid('F',5), group:'F', date:'2026-06-23', time:'18:00', venue:'Levi\'s Stadium', home:T.FRA, away:T.SUI },
      { id: mid('F',6), group:'F', date:'2026-06-23', time:'18:00', venue:'Levi\'s Stadium', home:T.NGA, away:T.POL },
    ],
  },
  {
    letter: 'G',
    teams: [T.ENG, T.SEN, T.UZB, T.CHN],
    matches: [
      { id: mid('G',1), group:'G', date:'2026-06-14', time:'18:00', venue:'Lincoln Financial', home:T.ENG, away:T.SEN },
      { id: mid('G',2), group:'G', date:'2026-06-14', time:'21:00', venue:'Lincoln Financial', home:T.UZB, away:T.CHN },
      { id: mid('G',3), group:'G', date:'2026-06-19', time:'15:00', venue:'Lincoln Financial', home:T.ENG, away:T.CHN },
      { id: mid('G',4), group:'G', date:'2026-06-19', time:'18:00', venue:'Lincoln Financial', home:T.SEN, away:T.UZB },
      { id: mid('G',5), group:'G', date:'2026-06-24', time:'15:00', venue:'Lincoln Financial', home:T.ENG, away:T.UZB },
      { id: mid('G',6), group:'G', date:'2026-06-24', time:'15:00', venue:'Lincoln Financial', home:T.SEN, away:T.CHN },
    ],
  },
  {
    letter: 'H',
    teams: [T.POR, T.EGY, T.NZL, T.QAT],
    matches: [
      { id: mid('H',1), group:'H', date:'2026-06-15', time:'12:00', venue:'Gillette Stadium', home:T.POR, away:T.EGY },
      { id: mid('H',2), group:'H', date:'2026-06-15', time:'15:00', venue:'Gillette Stadium', home:T.NZL, away:T.QAT },
      { id: mid('H',3), group:'H', date:'2026-06-19', time:'21:00', venue:'Gillette Stadium', home:T.POR, away:T.QAT },
      { id: mid('H',4), group:'H', date:'2026-06-20', time:'12:00', venue:'Gillette Stadium', home:T.EGY, away:T.NZL },
      { id: mid('H',5), group:'H', date:'2026-06-24', time:'18:00', venue:'Gillette Stadium', home:T.POR, away:T.NZL },
      { id: mid('H',6), group:'H', date:'2026-06-24', time:'18:00', venue:'Gillette Stadium', home:T.EGY, away:T.QAT },
    ],
  },
  {
    letter: 'I',
    teams: [T.NED, T.CRO, T.ALG, T.CHI],
    matches: [
      { id: mid('I',1), group:'I', date:'2026-06-15', time:'18:00', venue:'Allegiant Stadium', home:T.NED, away:T.CRO },
      { id: mid('I',2), group:'I', date:'2026-06-15', time:'21:00', venue:'Allegiant Stadium', home:T.ALG, away:T.CHI },
      { id: mid('I',3), group:'I', date:'2026-06-20', time:'15:00', venue:'Allegiant Stadium', home:T.NED, away:T.CHI },
      { id: mid('I',4), group:'I', date:'2026-06-20', time:'18:00', venue:'Allegiant Stadium', home:T.CRO, away:T.ALG },
      { id: mid('I',5), group:'I', date:'2026-06-25', time:'15:00', venue:'Allegiant Stadium', home:T.NED, away:T.ALG },
      { id: mid('I',6), group:'I', date:'2026-06-25', time:'15:00', venue:'Allegiant Stadium', home:T.CRO, away:T.CHI },
    ],
  },
  {
    letter: 'J',
    teams: [T.ITA, T.PER, T.SRB, T.RSA],
    matches: [
      { id: mid('J',1), group:'J', date:'2026-06-16', time:'12:00', venue:'Hard Rock Stadium', home:T.ITA, away:T.PER },
      { id: mid('J',2), group:'J', date:'2026-06-16', time:'15:00', venue:'Hard Rock Stadium', home:T.SRB, away:T.RSA },
      { id: mid('J',3), group:'J', date:'2026-06-20', time:'21:00', venue:'Hard Rock Stadium', home:T.ITA, away:T.RSA },
      { id: mid('J',4), group:'J', date:'2026-06-21', time:'12:00', venue:'Hard Rock Stadium', home:T.PER, away:T.SRB },
      { id: mid('J',5), group:'J', date:'2026-06-25', time:'18:00', venue:'Hard Rock Stadium', home:T.ITA, away:T.SRB },
      { id: mid('J',6), group:'J', date:'2026-06-25', time:'18:00', venue:'Hard Rock Stadium', home:T.PER, away:T.RSA },
    ],
  },
  {
    letter: 'K',
    teams: [T.BEL, T.VEN, T.AUT, T.HUN],
    matches: [
      { id: mid('K',1), group:'K', date:'2026-06-16', time:'18:00', venue:'Estadio BBVA',     home:T.BEL, away:T.VEN },
      { id: mid('K',2), group:'K', date:'2026-06-16', time:'21:00', venue:'Estadio BBVA',     home:T.AUT, away:T.HUN },
      { id: mid('K',3), group:'K', date:'2026-06-21', time:'15:00', venue:'Estadio BBVA',     home:T.BEL, away:T.HUN },
      { id: mid('K',4), group:'K', date:'2026-06-21', time:'18:00', venue:'Estadio BBVA',     home:T.VEN, away:T.AUT },
      { id: mid('K',5), group:'K', date:'2026-06-25', time:'21:00', venue:'Estadio BBVA',     home:T.BEL, away:T.AUT },
      { id: mid('K',6), group:'K', date:'2026-06-25', time:'21:00', venue:'Estadio BBVA',     home:T.VEN, away:T.HUN },
    ],
  },
  {
    letter: 'L',
    teams: [T.SVK, T.PAR, T.IND, T.BOL],
    matches: [
      { id: mid('L',1), group:'L', date:'2026-06-17', time:'12:00', venue:'Estadio Guadalajara', home:T.SVK, away:T.PAR },
      { id: mid('L',2), group:'L', date:'2026-06-17', time:'15:00', venue:'Estadio Guadalajara', home:T.IND, away:T.BOL },
      { id: mid('L',3), group:'L', date:'2026-06-22', time:'12:00', venue:'Estadio Guadalajara', home:T.SVK, away:T.BOL },
      { id: mid('L',4), group:'L', date:'2026-06-22', time:'15:00', venue:'Estadio Guadalajara', home:T.PAR, away:T.IND },
      { id: mid('L',5), group:'L', date:'2026-06-26', time:'15:00', venue:'Estadio Guadalajara', home:T.SVK, away:T.IND },
      { id: mid('L',6), group:'L', date:'2026-06-26', time:'15:00', venue:'Estadio Guadalajara', home:T.PAR, away:T.BOL },
    ],
  },
]

export const ALL_MATCHES: Match[] = GROUPS.flatMap(g => g.matches)

export function getMatchById(id: string): Match | undefined {
  return ALL_MATCHES.find(m => m.id === id)
}

export function isMatchPlayed(match: Match): boolean {
  return !!match.result
}

export function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }).toUpperCase()
}

export function formatMatchDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'short' }).toUpperCase()
}
