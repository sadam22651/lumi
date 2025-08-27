import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'


const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  })
}

export const adminAuth = getAuth()
