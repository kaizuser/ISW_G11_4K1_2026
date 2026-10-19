export enum PassType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
}

export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
}

export enum PurchaseStatus {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  CONFIRMADA = 'CONFIRMADA',
  CONFIRMADA_PAGO_EN_BOLETERIA = 'CONFIRMADA_PAGO_EN_BOLETERIA',
  RECHAZADA = 'RECHAZADA',
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ParkNow {
  date: string;
  time: string;
}
