'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserAvatar } from '@/components/user-avatar'
import { updateProfile, updateAvatar } from '@/lib/actions'
import { compressImageFile } from '@/lib/avatar-utils'
import { cn } from '@/lib/utils'

interface Player {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  points: number
  rank: number
}

interface MyProfile {
  userId: string
  email: string
  name: string
  displayName: string | null
  resolvedName: string
  avatarUrl: string | null
}

interface Props {
  players: Player[]
  myProfile: MyProfile
}

const PRIZES: Record<number, { label: string; desc: string }> = {
  1: { label: '1st', desc: 'Basement hoodie' },
  2: { label: '2nd', desc: 'Basement bottle' },
  3: { label: '3rd', desc: 'Basement tee' },
}

function PlayerIdentity({
  name,
  subtitle,
}: {
  name: string
  subtitle: string
}) {
  return (
    <div className="player-identity">
      <div className="player-identity-name">
        <span>{name}</span>
      </div>
      <div className="mono-label player-identity-sub">{subtitle}</div>
    </div>
  )
}

function PodiumCell({
  player,
  myId,
  rank,
}: {
  player: Player | undefined
  myId: string
  rank: number
}) {
  const prize = PRIZES[rank]
  const colorClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'
  const borderColor = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32'
  const isMe = player?.id === myId

  return (
    <div
      className={cn('podium-cell', isMe && 'is-me')}
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
            subtitle={player.email.split('@')[0]}
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
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(myProfile.resolvedName)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(myProfile.avatarUrl)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, startUpload] = useTransition()

  useEffect(() => {
    setNameValue(myProfile.resolvedName)
  }, [myProfile.resolvedName])

  const myRank = players.find(p => p.id === myProfile.userId)?.rank
  const myPoints = players.find(p => p.id === myProfile.userId)?.points ?? 0

  function handleNameSave() {
    if (nameValue.trim()) {
      startTransition(async () => {
        await updateProfile(nameValue.trim())
        setEditingName(false)
        router.refresh()
      })
    }
  }

  function handleAvatarSelect() {
    setUploadError(null)
    fileInputRef.current?.click()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    startUpload(async () => {
      try {
        const dataUrl = await compressImageFile(file)
        setAvatarPreview(dataUrl)
        await updateAvatar(dataUrl)
        router.refresh()
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Could not upload photo')
        setAvatarPreview(myProfile.avatarUrl)
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
            Overall pool ranking. First place wins basement merch. Points add up as matches are played.
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

      <div className="cell" style={{ marginBottom: '32px', position: 'relative' }}>
        <span style={{ position:'absolute', top:'-3px', left:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
        <span style={{ position:'absolute', top:'-3px', right:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
        <span style={{ position:'absolute', bottom:'-3px', left:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
        <span style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />

        <div className={cn('tabla-profile-grid', !myRank && 'tabla-profile-grid-no-rank')}>
          <div className="tabla-profile-info">
            <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>— YOUR PROFILE</div>

            <button
              type="button"
              className="mb-4 cursor-pointer transition-opacity disabled:cursor-wait disabled:opacity-60 hover:enabled:opacity-80"
              onClick={handleAvatarSelect}
              disabled={isUploading}
              aria-label="Upload profile photo"
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

            {editingName ? (
              <div style={{ display: 'flex', gap: '0', marginBottom: '8px' }}>
                <input
                  className="input"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                  style={{ flex: 1, height: '36px' }}
                  autoFocus
                />
                <button
                  className="btn solid"
                  onClick={handleNameSave}
                  disabled={isPending}
                  style={{ borderLeft: 'none' }}
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="profile-name-edit"
                onClick={() => setEditingName(true)}
                title="Click to edit name"
              >
                <span style={{ fontWeight: 600, fontSize: '18px', color: 'var(--fg-1)' }}>{nameValue}</span>
                <span className="mono-label" style={{ color: 'var(--fg-4)', fontSize: '10px' }}>EDIT</span>
              </button>
            )}

            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', height: '32px' }}
              onClick={handleAvatarSelect}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Upload photo'}
            </button>

            {uploadError && (
              <p className="mono-label" style={{ color: 'var(--color-contrast)', marginTop: '8px', fontSize: '10px' }}>
                {uploadError}
              </p>
            )}
          </div>

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

      {players.length >= 1 && (
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
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '12px' }}>
          — FULL RANKING
        </div>
        <div className="cell tabla-table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>POS</th>
                <th>PLAYER</th>
                <th>PRIZE</th>
                <th style={{ textAlign: 'right' }}>PTS</th>
              </tr>
            </thead>
            <tbody>
              {players.map(player => {
                const isMe = player.id === myProfile.userId
                const prize = PRIZES[player.rank]
                return (
                  <tr key={player.id} className={isMe ? 'my-row' : ''}>
                    <td>
                      <span className="mono-label" style={{ color: player.rank <= 3 ? 'var(--color-contrast)' : 'var(--fg-3)' }}>
                        {player.rank}
                      </span>
                    </td>
                    <td>
                      <div className="table-player-row">
                        <UserAvatar name={player.name} imageUrl={player.avatarUrl} highlight={isMe} />
                        <PlayerIdentity
                          name={player.name}
                          subtitle={player.email.split('@')[0]}
                        />
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
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: isMe ? 'var(--fg-1)' : 'var(--fg-2)',
                      }}>
                        {player.points}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {players.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--fg-4)', padding: '32px' }}>
                    <span className="mono-label">No players yet</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
