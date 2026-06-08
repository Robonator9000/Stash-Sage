import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findUnique({ where: { id } })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const consumeAmount = parseFloat(body.amount)

    if (!consumeAmount || consumeAmount <= 0) {
      return NextResponse.json(
        { error: 'A valid positive amount is required' },
        { status: 400 }
      )
    }

    const newAmount = Math.max(0, product.amount - consumeAmount)
    const consumedAt = body.consumedAt ? new Date(body.consumedAt) : new Date()

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        amount: newAmount,
        consumptionCount: product.consumptionCount + 1,
        lastConsumed: consumedAt,
      },
    })

    await db.consumptionLog.create({
      data: {
        productId: id,
        amount: consumeAmount,
        consumedAt,
        type: 'consume',
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        type: 'consumed',
        entityId: id,
        entityType: 'product',
        productName: product.name,
        details: JSON.stringify({ amount: consumeAmount, newAmount }),
      },
    })

    const settings = await db.appSettings.findUnique({ where: { id: 'app' } })
    const threshold = settings?.lowStockThreshold ?? 3
    const lowStock = newAmount > 0 && newAmount <= threshold

    return NextResponse.json({
      product: updatedProduct,
      ...(lowStock && { lowStock: true, threshold }),
    })
  } catch (error) {
    console.error('Error consuming product:', error)
    return NextResponse.json(
      { error: 'Failed to consume product' },
      { status: 500 }
    )
  }
}
