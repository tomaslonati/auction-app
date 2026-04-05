import { AuctionCategory, UserCategory } from '@prisma/client'

export const CATEGORY_RANK: Record<string, number> = {
  comun: 1,
  especial: 2,
  plata: 3,
  oro: 4,
  platino: 5,
}

export function canAccessAuction(
  userCategory: UserCategory | null | undefined,
  auctionCategory: AuctionCategory
): boolean {
  if (!userCategory) return false
  return CATEGORY_RANK[userCategory] >= CATEGORY_RANK[auctionCategory]
}
