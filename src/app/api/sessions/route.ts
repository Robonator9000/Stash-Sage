import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const sessions = await db.session.findMany({
      include: { product: true },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({
      where: { id: body.productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const session = await db.session.create({
      data: {
        productId: body.productId,
        amount: body.amount ?? 0,
        people: body.people ?? 1,
        hitsCount: body.hitsCount ?? 0,
        notes: body.notes ?? null,
        bowlsPerPerson: body.bowlsPerPerson ?? 0,
        personHits: body.personHits ?? '',
        rotationEnabled: body.rotationEnabled ?? false,
      },
      include: { product: true },
    })

    // Deduct from product amount and create consumption log
    if (body.amount && body.amount > 0) {
      const newAmount = Math.max(0, product.amount - body.amount)
      await db.product.update({
        where: { id: body.productId },
        data: {
          amount: newAmount,
          consumptionCount: product.consumptionCount + 1,
          lastConsumed: new Date(),
        },
      })

      await db.consumptionLog.create({
        data: {
          productId: body.productId,
          sessionId: session.id,
          amount: body.amount,
          consumedAt: new Date(),
          type: 'consume',
        },
      })
    }

    // Log activity
    await db.activityLog.create({
      data: {
        type: 'session_completed',
        entityId: session.id,
        entityType: 'session',
        productName: product.name,
        details: JSON.stringify({ amount: body.amount ?? 0, people: body.people ?? 1, notes: body.notes ?? null }),
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
