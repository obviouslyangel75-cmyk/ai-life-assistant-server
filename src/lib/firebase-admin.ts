import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

let app: App
let firestoreDb: Firestore
let adminAuth: Auth

function getFirebaseAdmin() {
  if (!app) {
    const existingApps = getApps()
    if (existingApps.length > 0) {
      app = existingApps[0]
    } else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : undefined

      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      })
    }
  }
  return app
}

export function getDb(): Firestore {
  if (!firestoreDb) {
    getFirebaseAdmin()
    firestoreDb = getFirestore()
    firestoreDb.settings({ ignoreUndefinedProperties: true })
  }
  return firestoreDb
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    getFirebaseAdmin()
    adminAuth = getAuth()
  }
  return adminAuth
}

export const COLLECTIONS = {
  CELEBRITIES: 'celebrities',
  USERS: 'users',
  BOOKINGS: 'bookings',
  FAN_CARDS: 'fanCards',
  REVIEWS: 'reviews',
  AGENT_LOGS: 'agentLogs',
  NOTIFICATIONS: 'notifications',
} as const
