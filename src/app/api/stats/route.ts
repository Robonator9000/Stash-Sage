import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const products = await db.product.findMany()

    const totalProducts = products.length
    const totalAmount = products.reduce((sum, p) => sum + p.amount, 0)
    const totalSessions = await db.session.count()

    const ratedProducts = products.filter((p) => p.rating > 0)
    const averageRating =
      ratedProducts.length > 0
        ? ratedProducts.reduce((sum, p) => sum + p.rating, 0) /
          ratedProducts.length
        : 0

    const thcProducts = products.filter((p) => p.thc > 0)
    const averageTHC =
      thcProducts.length > 0
        ? thcProducts.reduce((sum, p) => sum + p.thc, 0) / thcProducts.length
        : 0

    const totalValue = products.reduce((sum, p) => sum + p.price, 0)

    const consumedProducts = products.filter((p) => p.lastConsumed)
    const lastConsumed =
      consumedProducts.length > 0
        ? consumedProducts.sort(
            (a, b) =>
              new Date(b.lastConsumed!).getTime() -
              new Date(a.lastConsumed!).getTime()
          )[0].lastConsumed
        : null

    // Consumption trend: last 30 days, grouped by day
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const consumptionLogs = await db.consumptionLog.findMany({
      where: {
        consumedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { consumedAt: 'asc' },
    })

    const consumptionTrend: { date: string; amount: number }[] = []
    const trendMap = new Map<string, number>()

    for (const log of consumptionLogs) {
      const dateKey = new Date(log.consumedAt).toISOString().split('T')[0]
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + log.amount)
    }

    // Fill in missing days with 0
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      consumptionTrend.push({
        date: dateKey,
        amount: trendMap.get(dateKey) || 0,
      })
    }

    // Top strains by rating
    const topStrains = products
      .filter((p) => p.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        strain: p.strain,
        rating: p.rating,
        type: p.type,
      }))

    // Spending by month: last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recentProducts = await db.product.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
    })

    const spendingByMonth: { month: string; total: number }[] = []
    const spendingMap = new Map<string, number>()

    for (const p of recentProducts) {
      const monthKey = new Date(p.createdAt).toISOString().substring(0, 7)
      spendingMap.set(monthKey, (spendingMap.get(monthKey) || 0) + p.price)
    }

    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().substring(0, 7)
      spendingByMonth.push({
        month: monthKey,
        total: spendingMap.get(monthKey) || 0,
      })
    }

    // Stock distribution
    const settings = await db.appSettings.findUnique({ where: { id: 'app' } })
    const threshold = settings?.lowStockThreshold ?? 3

    const stockDistribution = {
      inStock: products.filter((p) => p.amount > threshold).length,
      lowStock: products.filter((p) => p.amount > 0 && p.amount <= threshold)
        .length,
      outOfStock: products.filter((p) => p.amount <= 0).length,
    }

    return NextResponse.json({
      totalProducts,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalSessions,
      averageRating: Math.round(averageRating * 10) / 10,
      averageTHC: Math.round(averageTHC * 10) / 10,
      totalValue: Math.round(totalValue * 100) / 100,
      lastConsumed,
      consumptionTrend,
      topStrains,
      spendingByMonth,
      stockDistribution,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
