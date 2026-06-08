import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}

    if (from || to) {
      const consumedAt: Record<string, Date> = {}
      if (from) consumedAt.gte = new Date(from)
      if (to) consumedAt.lte = new Date(to)
      where.consumedAt = consumedAt
    }

    if (productId) {
      where.productId = productId
    }

    if (type) {
      where.type = type
    }

    const total = await db.consumptionLog.count({ where })
    const totalPages = Math.ceil(total / limit)

    const logs = await db.consumptionLog.findMany({
      where,
      include: { product: true },
      orderBy: { consumedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({ logs, total, page, totalPages })
  } catch (error) {
    console.error('Error fetching consumption logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consumption logs' },
      { status: 500 }
    )
  }
}
