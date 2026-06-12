import { pgTable, text, timestamp, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core'

// --- Better Auth tables ---
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  isAnonymous: boolean('isAnonymous').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ---
export const predictions = pgTable('predictions', {
  id: text('id').primaryKey().default(''),
  userId: text('userId').notNull(),
  matchId: text('matchId').notNull(),
  homeScore: integer('homeScore').notNull(),
  awayScore: integer('awayScore').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey().default(''),
  userId: text('userId').notNull().unique(),
  displayName: text('displayName'),
  avatarUrl: text('avatarUrl'),
  recoveryPinHash: text('recoveryPinHash'),
  burnedAt: timestamp('burnedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const accountBurnVotes = pgTable(
  'account_burn_votes',
  {
    id: text('id').primaryKey(),
    targetUserId: text('targetUserId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    voterId: text('voterId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  table => [
    uniqueIndex('account_burn_votes_target_voter_unique').on(
      table.targetUserId,
      table.voterId,
    ),
  ],
)

export const predictionVotes = pgTable(
  'prediction_votes',
  {
    id: text('id').primaryKey(),
    predictionId: text('predictionId')
      .notNull()
      .references(() => predictions.id, { onDelete: 'cascade' }),
    voterId: text('voterId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  table => [
    uniqueIndex('prediction_votes_prediction_voter_unique').on(
      table.predictionId,
      table.voterId,
    ),
  ],
)
