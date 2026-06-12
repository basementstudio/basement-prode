'use client'

import { UserAvatar } from '@/components/user-avatar'
import { LeaderboardBurnVoteBtn } from '@/components/leaderboard-burn-vote-btn'
import { LeaderboardNameBadge } from '@/components/leaderboard-name-badge'
import {
  formatWinRate,
  formatLeaderboardSubtitle,
  type LeaderboardPlayer,
  type WorstBoardPlayer,
} from '@/lib/leaderboard-stats'
import { PRIZES_BY_RANK } from '@/lib/prizes'
import { cn } from '@/lib/utils'

type BoardMode = 'ranking' | 'worst'

interface Props {
  mode: BoardMode
  rankingPlayers: LeaderboardPlayer[]
  worstPlayers: WorstBoardPlayer[]
  myUserId: string
}

const PRIZES = PRIZES_BY_RANK

function PlayerIdentity({
  name,
  subtitle,
  rank,
  playerCount,
  isBurned,
}: {
  name: string
  subtitle: string
  rank?: number
  playerCount?: number
  isBurned?: boolean
}) {
  return (
    <div className="player-identity">
      <div className="player-identity-name">
        {rank != null && playerCount != null ? (
          <LeaderboardNameBadge
            name={name}
            rank={rank}
            playerCount={playerCount}
            isBurned={isBurned}
          />
        ) : isBurned ? (
          <LeaderboardNameBadge
            name={name}
            rank={0}
            playerCount={0}
            isBurned
            showRankingBadges={false}
          />
        ) : (
          <span>{name}</span>
        )}
      </div>
      <div className="mono-label player-identity-sub">{subtitle}</div>
    </div>
  )
}

export function LeaderboardTable({ mode, rankingPlayers, worstPlayers, myUserId }: Props) {
  const isRanking = mode === 'ranking'
  const rows = isRanking ? rankingPlayers : worstPlayers
  const isEmpty = rows.length === 0
  const playerCount = rankingPlayers.length

  return (
    <div className={cn('cell tabla-table-wrap', isRanking ? 'tabla-table-wrap--ranking' : 'tabla-table-wrap--worst')}>
      <table className="dtable">
        <thead>
          <tr>
            <th style={{ width: '48px' }}>POS</th>
            <th>PLAYER</th>
            {isRanking ? (
              <th>PRIZE</th>
            ) : (
              <th style={{ textAlign: 'right' }}>WIN %</th>
            )}
            <th style={{ textAlign: 'right' }}>PTS</th>
          </tr>
        </thead>
        <tbody>
          {isRanking &&
            rankingPlayers.map(player => {
              const isMe = player.id === myUserId
              const prize = PRIZES[player.rank]

              return (
                <tr
                  key={player.id}
                  className={cn(isMe && 'my-row', player.isBurned && 'is-burned')}
                >
                  <td>
                    <span
                      className="mono-label"
                      style={{ color: player.rank <= 3 ? 'var(--color-contrast)' : 'var(--fg-3)' }}
                    >
                      {player.rank}
                    </span>
                  </td>
                  <td>
                    <div className="table-player-row">
                      <UserAvatar name={player.name} imageUrl={player.avatarUrl} highlight={isMe} />
                      <PlayerIdentity
                        name={player.name}
                        subtitle={formatLeaderboardSubtitle(player)}
                        rank={player.rank}
                        playerCount={playerCount}
                        isBurned={player.isBurned}
                      />
                      {!isMe && (
                        <LeaderboardBurnVoteBtn
                          targetUserId={player.id}
                          initialVoteCount={player.burnVoteCount}
                          initialViewerHasVoted={player.viewerHasBurnVoted}
                          isBurned={player.isBurned}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    {prize ? (
                      <span className="mono-label" style={{ color: 'var(--fg-3)' }}>{prize.desc}</span>
                    ) : (
                      <span className="mono-label" style={{ color: 'var(--fg-4)' }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: isMe ? 'var(--fg-1)' : 'var(--fg-2)',
                      }}
                    >
                      {player.points}
                    </span>
                  </td>
                </tr>
              )
            })}

          {!isRanking &&
            worstPlayers.map(player => {
              const isMe = player.id === myUserId

              return (
                <tr
                  key={player.id}
                  className={cn(isMe && 'my-row', player.isBurned && 'is-burned')}
                >
                  <td>
                    <span className="mono-label" style={{ color: 'var(--fg-3)' }}>
                      {player.worstRank}
                    </span>
                  </td>
                  <td>
                    <div className="table-player-row">
                      <UserAvatar name={player.name} imageUrl={player.avatarUrl} highlight={isMe} />
                      <PlayerIdentity
                        name={player.name}
                        subtitle={`${player.hitCount}/${player.playedCount} hits`}
                        isBurned={player.isBurned}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      className="mono-label tabla-win-rate"
                      style={{
                        color: player.winRate === 0 ? 'var(--color-contrast)' : 'var(--fg-2)',
                      }}
                    >
                      {formatWinRate(player.winRate)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: isMe ? 'var(--fg-1)' : 'var(--fg-2)',
                      }}
                    >
                      {player.points}
                    </span>
                  </td>
                </tr>
              )
            })}

          {isEmpty && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--fg-4)', padding: '32px' }}>
                <span className="mono-label">No players yet</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
