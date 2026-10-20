import type { Purchase } from '../domain/purchase';
import { PurchaseStatus, type User } from '../domain/types';
import type { Repository } from '../services/dependencies';

export class InMemoryRepository implements Repository {
  private readonly users: User[];
  private readonly purchases = new Map<string, Purchase>();

  constructor(users: User[]) {
    this.users = users;
  }

  findUser(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  savePurchase(purchase: Purchase): void {
    this.purchases.set(purchase.id, purchase);
  }

  findPurchase(id: string): Purchase | undefined {
    return this.purchases.get(id);
  }

  countActiveTickets(userId: string, visitDate: string): number {
    return [...this.purchases.values()]
      .filter(
        (purchase) =>
          purchase.userId === userId &&
          purchase.visitDate === visitDate &&
          purchase.status !== PurchaseStatus.RECHAZADA,
      )
      .reduce((total, purchase) => total + purchase.ticketCount(), 0);
  }
}