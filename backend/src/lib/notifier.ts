import type { Order } from "../db/schema"

export interface OrderNotifier {
  sendOrderCreated(order: Order): Promise<void>
  sendOrderReady(order: Order): Promise<void>
}

class NoopOrderNotifier implements OrderNotifier {
  async sendOrderCreated(_order: Order) {}
  async sendOrderReady(_order: Order) {}
}

export function getOrderNotifier(): OrderNotifier {
  const provider = process.env.NOTIFICATION_PROVIDER ?? "none"
  if (provider !== "none") {
    throw new Error(`Notification provider '${provider}' is not implemented in the MVP`)
  }
  return new NoopOrderNotifier()
}

