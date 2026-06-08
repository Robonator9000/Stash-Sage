import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
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

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const product = await db.product.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.strain !== undefined && { strain: body.strain }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.thc !== undefined && { thc: body.thc }),
        ...(body.cbd !== undefined && { cbd: body.cbd }),
        ...(body.amount !== undefined && { amount: body.amount }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.picture !== undefined && { picture: body.picture }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.effects !== undefined && { effects: body.effects }),
        ...(body.favorite !== undefined && { favorite: body.favorite }),
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    await db.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
