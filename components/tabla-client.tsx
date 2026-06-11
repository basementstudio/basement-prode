'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile, updateAvatar } from '@/lib/actions'
import { compressImageFile } from '@/lib/avatar-utils'

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
  avatarUrl: string | null
}

interface Props {
  players: Player[]
  myProfile: MyProfile
}

const PRIZES: Record<number, { label: string; desc: string }> = {
  1: { label: '1°', desc: 'Buzo basement' },
  2: { label: '2°', desc: 'Botella basement' },
  3: { label: '3°', desc: 'Remera basement' },
}

function initials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function Avatar({
  name,
  url,
  size = 'sm',
}: {
  name: string
  url: string | null
  size?: 'sm' | 'lg'
}) {
  const cls = size === 'lg' ? 'avatar lg' : 'avatar'
  return (
    <div className={cls} aria-hidden="true">
      {url ? (
        <img src={url} alt={name} />
      ) : (
        initials(name)
      )}
    </div>
  )
}

function PlayerIdentity({
  name,
  subtitle,
  isMe,
}: {
  name: string
  subtitle: string
  isMe: boolean
}) {
  return (
    <div className="player-identity">
      <div className="player-identity-name">
        <span>{name}</span>
        {isMe && <span className="badge you">VOS</span>}
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
      className="podium-cell"
      style={{
        flex: 1,
        borderTopColor: borderColor,
        borderTopWidth: '2px',
        minHeight: '160px',
      }}
    >
      <div className={`podium-rank ${colorClass} mono-label`} style={{ marginBottom: '12px' }}>
        {prize.label} — {prize.desc.toUpperCase()}
      </div>
      {player ? (
        <div className="podium-player-row">
          <Avatar name={player.name} url={player.avatarUrl} />
          <PlayerIdentity
            name={player.name}
            subtitle={player.email}
            isMe={isMe}
          />
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: borderColor, lineHeight: 1 }}>{player.points}</div>
            <div className="mono-label" style={{ color: 'var(--fg-3)' }}>PTS</div>
          </div>
        </div>
      ) : (
        <div className="mono-label" style={{ color: 'var(--fg-4)' }}>Sin participantes aún</div>
      )}
    </div>
  )
}

export function TablaClient({ players, myProfile }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(myProfile.displayName || myProfile.name)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(myProfile.avatarUrl)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, startUpload] = useTransition()

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
        setUploadError(err instanceof Error ? err.message : 'No se pudo subir la foto')
        setAvatarPreview(myProfile.avatarUrl)
      }
    })
  }

  const top3 = [players[0], players[1], players[2]]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: '8px' }}>
            <span className="num">02</span>
            <span className="sep"> — </span>
            LEADERBOARD
            <span style={{ color: 'var(--fg-4)', margin: '0 8px' }}>·</span>
            ACTUALIZADO MD1
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
            La tabla.
          </h1>
          <p style={{ color: 'var(--fg-3)', fontSize: '15px', maxWidth: '480px', lineHeight: '1.5' }}>
            Ranking general del prode. El que termine 1° se lleva la merch de basement. Los puntos se suman a medida que se juegan los partidos.
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--fg-1)', lineHeight: 1 }}>
            {players.length}
          </div>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '2px' }}>JUGADORES</div>
          {myRank && (
            <>
              <div className="mono-label" style={{ color: 'var(--fg-3)', marginTop: '8px' }}>TU PUESTO</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-contrast)', lineHeight: 1 }}>
                {myRank}°
              </div>
            </>
          )}
        </div>
      </div>

      <div className="cell" style={{ marginBottom: '32px', position: 'relative' }}>
        <span style={{ position:'absolute', top:'-3px', left:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
        <span style={{ position:'absolute', top:'-3px', right:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
        <span style={{ position:'absolute', bottom:'-3px', left:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />
        <span style={{ position:'absolute', bottom:'-3px', right:'-3px', width:'6px', height:'6px', background:'var(--fg-1)', zIndex:2 }} />

        <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 280px', padding: '28px 28px', borderRight: '1px solid var(--fg-4)' }}>
            <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>— TU PERFIL</div>

            <button
              type="button"
              className="avatar lg avatar-upload"
              onClick={handleAvatarSelect}
              disabled={isUploading}
              aria-label="Subir foto de perfil"
              style={{ marginBottom: '16px' }}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt={nameValue} />
              ) : (
                initials(nameValue)
              )}
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
                title="Clic para editar nombre"
              >
                <span style={{ fontWeight: 600, fontSize: '18px', color: 'var(--fg-1)' }}>{nameValue}</span>
                <span className="mono-label" style={{ color: 'var(--fg-4)', fontSize: '10px' }}>EDITAR</span>
              </button>
            )}

            <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>
              {myProfile.email}
            </div>

            <button
              className="btn"
              style={{ width: '100%', justifyContent: 'center', height: '32px' }}
              onClick={handleAvatarSelect}
              disabled={isUploading}
            >
              {isUploading ? 'Subiendo…' : 'Subir foto'}
            </button>

            {uploadError && (
              <p className="mono-label" style={{ color: 'var(--color-contrast)', marginTop: '8px', fontSize: '10px' }}>
                {uploadError}
              </p>
            )}
          </div>

          <div style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: '160px' }}>
            <div style={{ fontSize: '56px', fontWeight: 700, lineHeight: 1, color: 'var(--fg-1)', marginBottom: '4px' }}>
              {myPoints}
            </div>
            <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '16px' }}>PUNTOS</div>
            {myRank && (
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-contrast)', lineHeight: 1 }}>
                {myRank}°
              </div>
            )}
          </div>
        </div>
      </div>

      {players.length >= 1 && (
        <div style={{ marginBottom: '32px' }}>
          <div className="mono-label" style={{ color: 'var(--fg-3)', marginBottom: '12px' }}>
            — PODIO
          </div>
          <div style={{ display: 'flex', gap: '0' }}>
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
          — RANKING COMPLETO
        </div>
        <div style={{ border: '1px solid var(--fg-4)' }}>
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>POS</th>
                <th>JUGADOR</th>
                <th>PREMIO</th>
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
                        <Avatar name={player.name} url={player.avatarUrl} />
                        <PlayerIdentity
                          name={player.name}
                          subtitle={player.email.split('@')[0]}
                          isMe={isMe}
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
                    <span className="mono-label">Sin participantes aún</span>
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
