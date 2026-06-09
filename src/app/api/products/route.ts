import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const filter = searchParams.get('filter') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { strain: { contains: search } },
        { brand: { contains: search } },
        { tags: { contains: search } },
        { effects: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (filter === 'favorites') {
      where.favorite = true
    } else if (filter === 'inStock') {
      where.amount = { gt: 0 }
    } else if (filter === 'lowStock') {
      where.amount = { gt: 0, lte: 3 }
    } else if (filter === 'outOfStock') {
      where.amount = { lte: 0 }
    } else if (['indica', 'sativa', 'hybrid'].includes(filter)) {
      where.type = filter
    }

    const total = await db.product.count({ where })
    const totalPages = Math.ceil(total / limit)

    const orderBy: Record<string, unknown>[] = [{ favorite: 'desc' }]

    switch (sort) {
      case 'oldest':
        orderBy.push({ createdAt: 'asc' })
        break
      case 'name':
        orderBy.push({ name: 'asc' })
        break
      case 'rating':
        orderBy.push({ rating: 'desc' })
        break
      case 'thc':
        orderBy.push({ thc: 'desc' })
        break
      case 'amount':
        orderBy.push({ amount: 'desc' })
        break
      case 'price':
        orderBy.push({ price: 'desc' })
        break
      case 'favorites':
        orderBy.push({ favorite: 'desc' })
        break
      case 'newest':
      default:
        orderBy.push({ createdAt: 'desc' })
        break
    }

    const products = await db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    return NextResponse.json({ products, total, page, totalPages })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        name: body.name.trim(),
        strain: body.strain || '',
        type: body.type || 'hybrid',
        thc: body.thc ?? 0,
        cbd: body.cbd ?? 0,
        amount: body.amount ?? 0,
        price: body.price ?? 0,
        picture: body.picture ?? null,
        notes: body.notes ?? null,
        rating: body.rating ?? 0,
        brand: body.brand ?? null,
        tags: body.tags ?? '',
        effects: body.effects ?? '',
        favorite: false,
        consumptionCount: 0,
      },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        type: 'product_created',
        entityId: product.id,
        entityType: 'product',
        productName: product.name,
        details: JSON.stringify({ name: product.name, type: product.type, amount: product.amount, price: product.price }),
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
