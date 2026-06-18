'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/user-avatar'
import { NameTakenDialog } from '@/components/name-taken-dialog'
import { LeaderboardNameBadge } from '@/components/leaderboard-name-badge'
import { LeaderboardTable } from '@/components/leaderboard-table'
import { saveMyProfile, type LeaderboardPlayer } from '@/lib/actions'
import { uploadAvatarFromFile } from '@/lib/upload-avatar-client'
import { buildWorstBoardPlayers } from '@/lib/leaderboard-stats'
import { cn } from '@/lib/utils'
import { PRIZES_BY_RANK } from '@/lib/prizes'
import { PrizeShowcase } from '@/components/prizes/prize-showcase'

interface MyProfile {
  userId: string
  email: string
  name: string
  displayName: string | null
  resolvedName: string
  avatarUrl: string | null
}

interface Props {
  players: LeaderboardPlayer[]
  myProfile: MyProfile
}

type BoardMode = 'ranking' | 'worst'

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

function PodiumCell({
  player,
  myId,
  rank,
  playerCount,
}: {
  player: LeaderboardPlayer | undefined
  myId: string
  rank: number
  playerCount: number
}) {
  const prize = PRIZES[rank]
  const colorClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'
  const borderColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'
  const isMe = player?.id === myId

  return (
    <div
      className={cn('podium-cell', isMe && 'is-me', player?.isBurned && 'is-burned')}
      style={{
        ...(!isMe ? { borderTopColor: borderColor, borderTopWidth: '2px' } : {}),
        minHeight: '120px',
      }}
    >
      <div className={`podium-rank ${colorClass} mono-label`} style={{ marginBottom: '12px' }}>
        {prize.label} — {prize.desc.toUpperCase()}
      </div>
      {player ? (
        <div className="podium-player-row">
          <UserAvatar name={player.name} imageUrl={player.avatarUrl} highlight={isMe} />
          <PlayerIdentity
            name={player.name}
            subtitle={`#${player.rank}`}
            rank={player.rank}
            playerCount={playerCount}
            isBurned={player.isBurned}
          />
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: borderColor, lineHeight: 1 }}>{player.points}</div>
            <div className="mono-label" style={{ color: 'var(--fg-3)' }}>PTS</div>
          </div>
        </div>
      ) : (
        <div className="mono-label" style={{ color: 'var(--fg-4)' }}>No players yet</div>
      )}
    </div>
  )
}

export function TablaClient({ players, myProfile }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewObjectUrlRef = useRef<string | null>(null)
  const [boardMode, setBoardMode] = useState<BoardMode>('ranking')
  const [nameValue, setNameValue] = useState(myProfile.resolvedName)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(myProfile.avatarUrl)
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [nameTakenOpen, setNameTakenOpen] = useState(false)
  const [isSaving, startSave] = useTransition()

  useEffect(() => {
    setNameValue(myProfile.resolvedName)
    setAvatarPreview(myProfile.avatarUrl)
    setPendingAvatarFile(null)
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
  }, [myProfile.resolvedName, myProfile.avatarUrl])

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
      }
    }
  }, [])

  const isProfileDirty =
    nameValue.trim() !== myProfile.resolvedName || pendingAvatarFile !== null

  const myRank = players.find(p => p.id === myProfile.userId)?.rank
  const myPoints = players.find(p => p.id === myProfile.userId)?.points ?? 0
  const worstPlayers = useMemo(() => buildWorstBoardPlayers(players), [players])
  const myWorstRank = worstPlayers.find(p => p.id === myProfile.userId)?.worstRank

  function handleAvatarSelect() {
    setProfileError(null)
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
    }

    const objectUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = objectUrl
    setAvatarPreview(objectUrl)
    setPendingAvatarFile(file)
    setProfileError(null)
  }

  function handleCancelProfile() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    setNameValue(myProfile.resolvedName)
    setAvatarPreview(myProfile.avatarUrl)
    setPendingAvatarFile(null)
    setProfileError(null)
  }

  function handleSaveProfile() {
    const trimmed = nameValue.trim()
    if (!trimmed) {
      setProfileError('Enter a name.')
      return
    }

    startSave(async () => {
      try {
        let avatarUrl: string | undefined
        if (pendingAvatarFile) {
          avatarUrl = await uploadAvatarFromFile(pendingAvatarFile)
        }

        await saveMyProfile(trimmed, avatarUrl)

        if (previewObjectUrlRef.current) {
          URL.revokeObjectURL(previewObjectUrlRef.current)
          previewObjectUrlRef.current = null
        }
        setPendingAvatarFile(null)
        setProfileError(null)
        router.refresh()
      } catch (err) {
        if (err instanceof Error && err.message === 'NAME_TAKEN') {
          setNameTakenOpen(true)
          return
        }
        setProfileError(err instanceof Error ? err.message : 'Could not save profile')
      }
    })
  }

  const top3 = [players[0], players[1], players[2]]

  return (
    <div className="tabla-page">
      <div className="tabla-header">
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">02</span>
            <span className="sep"> — </span>
            LEADERBOARD
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            UPDATED MD1
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            The leaderboard.
          </h1>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '480px', lineHeight: '1.5' }}>
            Basement ranking for the internal prode. First place wins Basement merch. Points add up as matches are played.
          </p>
        </div>
        <div className="tabla-header-stats">
          <div className="tabla-stat-block">
            <span className="mono-label" style={{ color: 'var(--fg-3)' }}>PLAYERS</span>
            <span className="tabla-stat-value">{players.length}</span>
          </div>
          {myRank && (
            <div className="tabla-stat-block">
              <span className="mono-label" style={{ color: 'var(--fg-3)' }}>YOUR RANK</span>
              <span className="tabla-stat-value-accent">{myRank}</span>
            </div>
          )}
        </div>
      </div>

      <div className="tabla-top-sections">
        <div className="cell tabla-profile-card">
          <div className="tabla-profile-card-inner">
            <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>— YOUR PROFILE</div>

            <button
              type="button"
              className="mb-4 cursor-pointer transition-opacity disabled:cursor-wait disabled:opacity-60 hover:enabled:opacity-80"
              onClick={handleAvatarSelect}
              disabled={isSaving}
              aria-label="Change profile photo"
            >
              <UserAvatar name={nameValue} imageUrl={avatarPreview} size="lg" highlight />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              hidden
            />

            <label className="mono-label" style={{ display: 'block', color: 'var(--fg-3)', marginBottom: '8px' }}>
              Your name
            </label>
            <input
              className="input"
              value={nameValue}
              onChange={e => {
                setNameValue(e.target.value)
                setProfileError(null)
              }}
              style={{ width: '100%', height: '36px', marginBottom: '12px' }}
              maxLength={40}
              disabled={isSaving}
            />

            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', height: '32px' }}
              onClick={handleAvatarSelect}
              disabled={isSaving}
            >
              Change photo
            </button>

            {isProfileDirty && (
              <div style={{ display: 'flex', gap: '0', marginTop: '12px' }}>
                <button
                  className="btn solid"
                  style={{ flex: 1, justifyContent: 'center', height: '36px' }}
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : 'Save profile'}
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, justifyContent: 'center', height: '36px', borderLeft: 'none' }}
                  onClick={handleCancelProfile}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            )}

            {profileError && (
              <p className="mono-label" style={{ color: 'var(--color-contrast)', marginTop: '8px', fontSize: '10px' }}>
                {profileError}
              </p>
            )}
          </div>
        </div>

        <div className={cn('cell tabla-standings-card', !myRank && 'tabla-standings-card-solo')}>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>— YOUR STANDING</div>
          <div className="tabla-standings-grid">
            <div className="tabla-profile-stat">
              <span className="tabla-profile-stat-value">{myPoints}</span>
              <span className="mono-label" style={{ color: 'var(--fg-3)' }}>POINTS</span>
            </div>
            {myRank && (
              <div className="tabla-profile-stat">
                <span className="tabla-profile-stat-value-accent">{myRank}</span>
                <span className="mono-label" style={{ color: 'var(--fg-3)' }}>RANK</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PrizeShowcase />

      {boardMode === 'ranking' && players.length >= 1 && (
        <div style={{ marginBottom: '32px' }}>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '12px' }}>
            — PODIUM
          </div>
          <div className="tabla-podium-grid">
            {[1, 2, 3].map(rank => (
              <PodiumCell
                key={rank}
                rank={rank}
                player={top3[rank - 1]}
                myId={myProfile.userId}
                playerCount={players.length}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '12px' }}>
          {boardMode === 'ranking' ? '— FULL RANKING' : '— WORST BOARD'}
        </div>

        <div className="view-mode-tabs tabla-board-tabs">
          <button
            type="button"
            className={cn('view-mode-tab', boardMode === 'ranking' && 'is-active')}
            aria-pressed={boardMode === 'ranking'}
            onClick={() => setBoardMode('ranking')}
          >
            Ranking
            <span className="view-mode-tab-count">{players.length}</span>
          </button>
          <button
            type="button"
            className={cn('view-mode-tab', boardMode === 'worst' && 'is-active')}
            aria-pressed={boardMode === 'worst'}
            onClick={() => setBoardMode('worst')}
          >
            <span className="tabla-tab-label-full">Worst board</span>
            <span className="tabla-tab-label-short">Worst</span>
            {myWorstRank != null && (
              <span className="view-mode-tab-count">#{myWorstRank}</span>
            )}
          </button>
        </div>

        {boardMode === 'worst' && (
          <p className="tabla-board-desc mono-label">
            Lowest win rate on top. Only scored matches where you submitted a prediction.
          </p>
        )}

        <LeaderboardTable
          mode={boardMode}
          rankingPlayers={players}
          worstPlayers={worstPlayers}
          myUserId={myProfile.userId}
        />
      </div>

      <NameTakenDialog
        open={nameTakenOpen}
        name={nameValue.trim()}
        onClose={() => setNameTakenOpen(false)}
      />
    </div>
  )
}
