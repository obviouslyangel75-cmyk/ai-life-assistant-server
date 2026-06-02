/**
 * Firestore database layer — drop-in replacement for Prisma.
 * All methods match the Prisma API used throughout the app so
 * no other files need to change.
 */
import { getDb, COLLECTIONS } from './firebase-admin'
import { FieldValue, Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { v4 as uuid } from 'uuid'

// ── helpers ────────────────────────────────────────────────────────────────

function toObj(doc: DocumentSnapshot | QueryDocumentSnapshot) {
  if (!doc.exists) return null
  const data = doc.data()!
  const result: any = { id: doc.id, ...data }
  // Convert Firestore Timestamps → JS Dates
  Object.entries(result).forEach(([k, v]) => {
    if (v instanceof Timestamp) result[k] = v.toDate()
  })
  return result
}

function applyWhere(query: any, where: Record<string, any> = {}): any {
  Object.entries(where).forEach(([key, value]) => {
    if (value === undefined) return
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      if ('gte' in value && value.gte !== undefined) query = query.where(key, '>=', value.gte)
      if ('lte' in value && value.lte !== undefined) query = query.where(key, '<=', value.lte)
      if ('increment' in value) return // handled separately in update
      // contains / mode insensitive: skip (do client-side)
    } else if (value !== null) {
      query = query.where(key, '==', value)
    }
  })
  return query
}

function applyOrderBy(query: any, orderBy: any): any {
  if (!orderBy) return query
  if (Array.isArray(orderBy)) {
    orderBy.forEach((o: any) => {
      const [field, dir] = Object.entries(o)[0] as [string, string]
      query = query.orderBy(field, dir as any)
    })
  } else {
    const [field, dir] = Object.entries(orderBy)[0] as [string, string]
    query = query.orderBy(field, dir as any)
  }
  return query
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// ── Celebrity ─────────────────────────────────────────────────────────────

const celebrity = {
  async findMany({ where, orderBy, skip, take }: any = {}): Promise<any[]> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.CELEBRITIES)

    // Firestore only allows equality / range on indexed fields.
    // We do equality filters first, then client-side text search.
    const simpleWhere: Record<string, any> = {}
    const containsFilters: Array<{ key: string; value: string }> = []

    if (where) {
      if (where.available !== undefined) simpleWhere.available = where.available
      if (where.category !== undefined) simpleWhere.category = where.category
      if (where.featured !== undefined) simpleWhere.featured = where.featured
      if (where.OR) {
        // Extract text-search patterns from OR clauses
        where.OR.forEach((clause: any) => {
          Object.entries(clause).forEach(([k, v]: any) => {
            if (v?.contains) containsFilters.push({ key: k, value: v.contains.toLowerCase() })
          })
        })
      }
      if (where.meetPrice) {
        if (where.meetPrice.gte !== undefined) q = q.where('meetPrice', '>=', where.meetPrice.gte)
        if (where.meetPrice.lte !== undefined) q = q.where('meetPrice', '<=', where.meetPrice.lte)
      }
    }

    Object.entries(simpleWhere).forEach(([k, v]) => { q = q.where(k, '==', v) })

    // Default ordering so Firestore is happy when no orderBy given
    const hasRangeFilter = !!(where?.meetPrice?.gte || where?.meetPrice?.lte)
    if (hasRangeFilter) {
      q = q.orderBy('meetPrice', 'asc')
    } else if (orderBy) {
      const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
      entries.forEach((o: any) => {
        const [field, dir] = Object.entries(o)[0] as [string, string]
        try { q = q.orderBy(field, dir as any) } catch {}
      })
    } else {
      q = q.orderBy('featured', 'desc')
    }

    const snap = await q.get()
    let results = snap.docs.map(toObj).filter(Boolean)

    // Client-side text search
    if (containsFilters.length > 0) {
      results = results.filter((doc: any) =>
        containsFilters.some(({ key, value }) =>
          String(doc[key] || '').toLowerCase().includes(value)
        )
      )
    }

    if (skip) results = results.slice(skip)
    if (take) results = results.slice(0, take)
    return results
  },

  async findUnique({ where, include }: any): Promise<any> {
    const db = getDb()
    let doc: DocumentSnapshot

    if (where.id) {
      doc = await db.collection(COLLECTIONS.CELEBRITIES).doc(where.id).get()
    } else if (where.slug) {
      const snap = await db.collection(COLLECTIONS.CELEBRITIES).where('slug', '==', where.slug).limit(1).get()
      if (snap.empty) return null
      doc = snap.docs[0]
    } else {
      return null
    }

    const cel = toObj(doc)
    if (!cel) return null

    if (include?.reviews) {
      const revSnap = await db.collection(COLLECTIONS.REVIEWS)
        .where('celebrityId', '==', cel.id)
        .orderBy('createdAt', 'desc')
        .limit(6)
        .get()
      const userIds = Array.from(new Set(revSnap.docs.map(d => d.data().userId)))
      const usersMap: Record<string, any> = {}
      await Promise.all(userIds.map(async uid => {
        const u = await db.collection(COLLECTIONS.USERS).doc(uid as string).get()
        usersMap[uid as string] = toObj(u)
      }))
      cel.reviews = revSnap.docs.map(d => {
        const r = toObj(d)!
        r.user = usersMap[r.userId] || { name: 'Fan' }
        return r
      })
    }

    return cel
  },

  async count({ where }: any = {}): Promise<number> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.CELEBRITIES)
    if (where?.available !== undefined) q = q.where('available', '==', where.available)
    if (where?.category) q = q.where('category', '==', where.category)
    const snap = await q.get()
    return snap.size
  },

  async create({ data }: any): Promise<any> {
    const db = getDb()
    const id = slugify(data.name) + '-' + Date.now()
    const now = new Date()
    const doc = { ...data, createdAt: now, updatedAt: now }
    await db.collection(COLLECTIONS.CELEBRITIES).doc(id).set(doc)
    return { id, ...doc }
  },

  async update({ where, data }: any): Promise<any> {
    const db = getDb()
    const ref = db.collection(COLLECTIONS.CELEBRITIES).doc(where.id)
    const update: any = { ...data, updatedAt: new Date() }

    // Handle increment operations
    Object.entries(data).forEach(([k, v]: any) => {
      if (v && typeof v === 'object' && 'increment' in v) {
        update[k] = FieldValue.increment(v.increment)
      }
    })

    await ref.update(update)
    const updated = await ref.get()
    return toObj(updated)
  },

  async delete({ where }: any): Promise<any> {
    const db = getDb()
    await db.collection(COLLECTIONS.CELEBRITIES).doc(where.id).delete()
    return { id: where.id }
  },

  async upsert({ where, update: updateData, create: createData }: any): Promise<any> {
    const db = getDb()
    const slug = where.slug as string
    const snap = await db.collection(COLLECTIONS.CELEBRITIES).where('slug', '==', slug).limit(1).get()
    if (!snap.empty) {
      // exists — skip update (seed logic: update: {})
      return toObj(snap.docs[0])
    }
    return celebrity.create({ data: createData })
  },
}

// ── User ──────────────────────────────────────────────────────────────────

const user = {
  async findUnique({ where }: any): Promise<any> {
    const db = getDb()
    if (where.id) {
      const doc = await db.collection(COLLECTIONS.USERS).doc(where.id).get()
      return toObj(doc)
    }
    if (where.email) {
      const snap = await db.collection(COLLECTIONS.USERS).where('email', '==', where.email).limit(1).get()
      return snap.empty ? null : toObj(snap.docs[0])
    }
    return null
  },

  async findMany({ where, orderBy, select }: any = {}): Promise<any[]> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.USERS)
    if (where?.role) q = q.where('role', '==', where.role)
    q = q.orderBy('createdAt', 'desc')
    const snap = await q.get()
    return snap.docs.map(toObj).filter(Boolean)
  },

  async create({ data }: any): Promise<any> {
    const db = getDb()
    const id = uuid()
    const now = new Date()
    const doc = { ...data, createdAt: now, updatedAt: now }
    await db.collection(COLLECTIONS.USERS).doc(id).set(doc)
    return { id, ...doc }
  },

  async update({ where, data }: any): Promise<any> {
    const db = getDb()
    const ref = db.collection(COLLECTIONS.USERS).doc(where.id)
    await ref.update({ ...data, updatedAt: new Date() })
    const updated = await ref.get()
    return toObj(updated)
  },

  async upsert({ where, update: updateData, create: createData }: any): Promise<any> {
    const existing = await user.findUnique({ where })
    if (existing) return existing
    return user.create({ data: createData })
  },

  async count({ where }: any = {}): Promise<number> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.USERS)
    if (where?.role) q = q.where('role', '==', where.role)
    const snap = await q.get()
    return snap.size
  },
}

// ── Booking ───────────────────────────────────────────────────────────────

const booking = {
  async create({ data }: any): Promise<any> {
    const db = getDb()
    const id = uuid()
    const now = new Date()
    const doc = { ...data, createdAt: now, updatedAt: now }
    if (data.bookingDate && !(data.bookingDate instanceof Date)) {
      doc.bookingDate = new Date(data.bookingDate)
    }
    await db.collection(COLLECTIONS.BOOKINGS).doc(id).set(doc)
    return { id, ...doc }
  },

  async findMany({ where, include, orderBy, skip, take }: any = {}): Promise<any[]> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.BOOKINGS)
    if (where?.userId) q = q.where('userId', '==', where.userId)
    if (where?.status) q = q.where('status', '==', where.status)
    q = q.orderBy('createdAt', 'desc')
    const snap = await q.get()
    let results = snap.docs.map(toObj).filter(Boolean)
    if (skip) results = results.slice(skip)
    if (take) results = results.slice(0, take)

    if (include?.celebrity || include?.user) {
      await Promise.all(results.map(async (b: any) => {
        if (include?.celebrity && b.celebrityId) {
          const celDoc = await db.collection(COLLECTIONS.CELEBRITIES).doc(b.celebrityId).get()
          const cel = toObj(celDoc)
          b.celebrity = cel ? { name: cel.name, imageUrl: cel.imageUrl, slug: cel.slug } : null
        }
        if (include?.user && b.userId) {
          const uDoc = await db.collection(COLLECTIONS.USERS).doc(b.userId).get()
          const u = toObj(uDoc)
          b.user = u ? { name: u.name, email: u.email } : null
        }
      }))
    }

    return results
  },

  async findUnique({ where, include }: any): Promise<any> {
    const db = getDb()
    const doc = await db.collection(COLLECTIONS.BOOKINGS).doc(where.id).get()
    const b = toObj(doc)
    if (!b) return null

    if (include?.celebrity && b.celebrityId) {
      const celDoc = await db.collection(COLLECTIONS.CELEBRITIES).doc(b.celebrityId).get()
      const cel = toObj(celDoc)
      b.celebrity = cel || null
    }
    if (include?.user && b.userId) {
      const uDoc = await db.collection(COLLECTIONS.USERS).doc(b.userId).get()
      b.user = toObj(uDoc)
    }
    return b
  },

  async update({ where, data }: any): Promise<any> {
    const db = getDb()
    const ref = db.collection(COLLECTIONS.BOOKINGS).doc(where.id)
    await ref.update({ ...data, updatedAt: new Date() })
    const updated = await ref.get()
    return toObj(updated)
  },

  async updateMany({ where, data }: any): Promise<any> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.BOOKINGS)
    if (where?.bookingId) q = q.where('bookingId', '==', where.bookingId)
    const snap = await q.get()
    const batch = db.batch()
    snap.docs.forEach((doc: any) => batch.update(doc.ref, data))
    await batch.commit()
    return { count: snap.size }
  },

  async count({ where }: any = {}): Promise<number> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.BOOKINGS)
    if (where?.status) q = q.where('status', '==', where.status)
    if (where?.userId) q = q.where('userId', '==', where.userId)
    const snap = await q.get()
    return snap.size
  },

  async aggregate({ _sum }: any): Promise<any> {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.BOOKINGS).get()
    const result: any = { _sum: {} }
    if (_sum) {
      Object.keys(_sum).forEach(field => {
        result._sum[field] = snap.docs.reduce((acc, doc) => {
          const val = doc.data()[field]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
      })
    }
    return result
  },
}

// ── FanCard ───────────────────────────────────────────────────────────────

const fanCard = {
  async create({ data }: any): Promise<any> {
    const db = getDb()
    const id = uuid()
    const now = new Date()
    const doc = { ...data, purchasedAt: now }
    await db.collection(COLLECTIONS.FAN_CARDS).doc(id).set(doc)
    return { id, ...doc }
  },

  async findMany({ where, include, orderBy }: any = {}): Promise<any[]> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.FAN_CARDS)
    if (where?.userId) q = q.where('userId', '==', where.userId)
    q = q.orderBy('purchasedAt', 'desc')
    const snap = await q.get()
    let results = snap.docs.map(toObj).filter(Boolean)

    if (include?.celebrity) {
      await Promise.all(results.map(async (fc: any) => {
        if (fc.celebrityId) {
          const celDoc = await db.collection(COLLECTIONS.CELEBRITIES).doc(fc.celebrityId).get()
          const cel = toObj(celDoc)
          fc.celebrity = cel ? { name: cel.name, imageUrl: cel.imageUrl, slug: cel.slug } : null
        }
      }))
    }
    return results
  },

  async count(): Promise<number> {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.FAN_CARDS).get()
    return snap.size
  },
}

// ── AgentLog ──────────────────────────────────────────────────────────────

const agentLog = {
  async create({ data }: any): Promise<any> {
    const db = getDb()
    const id = uuid()
    const doc = { ...data, createdAt: new Date() }
    await db.collection(COLLECTIONS.AGENT_LOGS).doc(id).set(doc)
    return { id, ...doc }
  },

  async updateMany({ where, data }: any): Promise<any> {
    const db = getDb()
    let q: any = db.collection(COLLECTIONS.AGENT_LOGS)
    if (where?.bookingId) q = q.where('bookingId', '==', where.bookingId)
    if (where?.action) q = q.where('action', '==', where.action)
    const snap = await q.get()
    const batch = db.batch()
    snap.docs.forEach((doc: any) => batch.update(doc.ref, data))
    await batch.commit()
    return { count: snap.size }
  },
}

// ── Export single object matching Prisma API surface ─────────────────────

export const prisma = { celebrity, user, booking, fanCard, agentLog }
