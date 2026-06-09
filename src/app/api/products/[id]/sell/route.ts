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
    const sellAmount = parseFloat(body.amount)

    if (!sellAmount || sellAmount <= 0) {
      return NextResponse.json(
        { error: 'A valid positive amount is required' },
        { status: 400 }
      )
    }

    const newAmount = Math.max(0, product.amount - sellAmount)

    const updatedProduct = await db.product.update({
      where: { id },
      data: {
        amount: newAmount,
        consumptionCount: product.consumptionCount + 1,
        lastConsumed: new Date(),
      },
    })

    await db.consumptionLog.create({
      data: {
        productId: id,
        amount: sellAmount,
        consumedAt: new Date(),
        type: 'sell',
        note: body.note ?? null,
      },
    })

    // Log activity with detailed sale info
    await db.activityLog.create({
      data: {
        type: 'sold',
        entityId: id,
        entityType: 'product',
        productName: product.name,
        details: JSON.stringify({ amount: sellAmount, remaining: newAmount, previousAmount: product.amount, note: body.note ?? null }),
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
    console.error('Error selling product:', error)
    return NextResponse.json(
      { error: 'Failed to sell product' },
      { status: 500 }
    )
  }
}
