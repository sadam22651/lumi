// src/lib/firebase-admin.ts
import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY
// PRIVATE KEY biasanya berisi "\n" yang harus di-normalize
const privateKey = privateKeyRaw ? privateKeyRaw.replace(/\\n/g, '\n') : undefined

if (!getApps().length) {
  if (projectId && clientEmail && privateKey) {
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey,
    }
    initializeApp({ credential: cert(serviceAccount) })
  } else {
    initializeApp()
  }
}

export const adminAuth = getAuth()
