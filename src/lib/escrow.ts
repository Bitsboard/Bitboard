import { EscrowStatus, type Escrow } from "./types";

// Escrow fee calculation (1% default)
export const ESCROW_FEE_BPS = 100; // 1% = 100 basis points

export function calculateEscrowFee(amountSats: number, feeBps: number = ESCROW_FEE_BPS): number {
  return Math.ceil((amountSats * feeBps) / 10000);
}

export function calculateTotalAmount(amountSats: number, feeBps: number = ESCROW_FEE_BPS): number {
  return amountSats + calculateEscrowFee(amountSats, feeBps);
}

// Mock Lightning Network backend for development
export class MockLightningBackend {
  private invoices: Map<string, { amount: number; status: "pending" | "settled" | "cancelled" }> = new Map();

  async createHoldInvoice(amountSats: number, description?: string): Promise<string> {
    const invoiceId = `lnbchold${amountSats}n1p${this.generateRandomString(8)}...`;
    this.invoices.set(invoiceId, { amount: amountSats, status: "pending" });
    
    console.log(`[MOCK] Created hold invoice: ${invoiceId} for ${amountSats} sats`);
    return invoiceId;
  }

  async settleInvoice(invoiceId: string): Promise<boolean> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.status !== "pending") {
      return false;
    }
    
    invoice.status = "settled";
    console.log(`[MOCK] Settled invoice: ${invoiceId}`);
    return true;
  }

  async cancelInvoice(invoiceId: string): Promise<boolean> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.status !== "pending") {
      return false;
    }
    
    invoice.status = "cancelled";
    console.log(`[MOCK] Cancelled invoice: ${invoiceId}`);
    return true;
  }

  async getInvoiceStatus(invoiceId: string): Promise<"pending" | "settled" | "cancelled" | "unknown"> {
    const invoice = this.invoices.get(invoiceId);
    return invoice?.status || "unknown";
  }

  private generateRandomString(length: number): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Real Lightning Network backend interfaces (for future implementation)
export interface LightningBackend {
  createHoldInvoice(amountSats: number, description?: string): Promise<string>;
  settleInvoice(invoiceId: string): Promise<boolean>;
  cancelInvoice(invoiceId: string): Promise<boolean>;
  getInvoiceStatus(invoiceId: string): Promise<"pending" | "settled" | "cancelled" | "unknown">;
}

// LND (Lightning Network Daemon) backend
export class LNDBackend implements LightningBackend {
  private host: string;
  private port: string;
  private macaroon: string;
  private cert: string;

  constructor(host: string, port: string, macaroon: string, cert: string) {
    this.host = host;
    this.port = port;
    this.macaroon = macaroon;
    this.cert = cert;
  }

  async createHoldInvoice(amountSats: number, description?: string): Promise<string> {
    // TODO: Implement LND gRPC call to create hold invoice
    throw new Error("LND backend not yet implemented");
  }

  async settleInvoice(invoiceId: string): Promise<boolean> {
    // TODO: Implement LND gRPC call to settle invoice
    throw new Error("LND backend not yet implemented");
  }

  async cancelInvoice(invoiceId: string): Promise<boolean> {
    // TODO: Implement LND gRPC call to cancel invoice
    throw new Error("LND backend not yet implemented");
  }

  async getInvoiceStatus(invoiceId: string): Promise<"pending" | "settled" | "cancelled" | "unknown"> {
    // TODO: Implement LND gRPC call to get invoice status
    throw new Error("LND backend not yet implemented");
  }
}

// Core Lightning (CLN) backend
export class CLNBackend implements LightningBackend {
  private host: string;
  private port: string;
  private macaroon: string;

  constructor(host: string, port: string, macaroon: string) {
    this.host = host;
    this.port = port;
    this.macaroon = macaroon;
  }

  async createHoldInvoice(amountSats: number, description?: string): Promise<string> {
    // TODO: Implement CLN REST API call to create hold invoice
    throw new Error("CLN backend not yet implemented");
  }

  async settleInvoice(invoiceId: string): Promise<boolean> {
    // TODO: Implement CLN REST API call to settle invoice
    throw new Error("CLN backend not yet implemented");
  }

  async cancelInvoice(invoiceId: string): Promise<boolean> {
    // TODO: Implement CLN REST API call to cancel invoice
    throw new Error("CLN backend not yet implemented");
  }

  async getInvoiceStatus(invoiceId: string): Promise<"pending" | "settled" | "cancelled" | "unknown"> {
    // TODO: Implement CLN REST API call to get invoice status
    throw new Error("CLN backend not yet implemented");
  }
}

// LNbits backend
export class LNbitsBackend implements LightningBackend {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async createHoldInvoice(amountSats: number, description?: string): Promise<string> {
    // TODO: Implement LNbits API call to create hold invoice
    throw new Error("LNbits backend not yet implemented");
  }

  async settleInvoice(invoiceId: string): Promise<boolean> {
    // TODO: Implement LNbits API call to settle invoice
    throw new Error("LNbits backend not yet implemented");
  }

  async cancelInvoice(invoiceId: string): Promise<boolean> {
    // TODO: Implement LNbits API call to cancel invoice
    throw new Error("LNbits backend not yet implemented");
  }

  async getInvoiceStatus(invoiceId: string): Promise<"pending" | "settled" | "cancelled" | "unknown"> {
    // TODO: Implement LNbits API call to get invoice status
    throw new Error("LNbits backend not yet implemented");
  }
}

// Factory function to create the appropriate Lightning backend
export function createLightningBackend(type: string, config: any): LightningBackend {
  switch (type.toLowerCase()) {
    case "lnd":
      return new LNDBackend(config.host, config.port, config.macaroon, config.cert);
    case "cln":
      return new CLNBackend(config.host, config.port, config.macaroon);
    case "lnbits":
      return new LNbitsBackend(config.baseUrl, config.apiKey);
    case "mock":
    default:
      return new MockLightningBackend();
  }
}

// Escrow state machine
export class EscrowStateMachine {
  private escrow: Escrow;
  private lightningBackend: LightningBackend;

  constructor(escrow: Escrow, lightningBackend: LightningBackend) {
    this.escrow = escrow;
    this.lightningBackend = lightningBackend;
  }

  async propose(): Promise<boolean> {
    if (this.escrow.status !== "PROPOSED") {
      throw new Error(`Cannot propose escrow in ${this.escrow.status} state`);
    }

    try {
      const holdInvoice = await this.lightningBackend.createHoldInvoice(
        this.escrow.amountSats + this.escrow.feeSats,
        `Escrow for listing ${this.escrow.listingId}`
      );
      
      this.escrow.holdInvoice = holdInvoice;
      return true;
    } catch (error) {
      console.error("Failed to create hold invoice:", error);
      return false;
    }
  }

  async fund(): Promise<boolean> {
    if (this.escrow.status !== "PROPOSED") {
      throw new Error(`Cannot fund escrow in ${this.escrow.status} state`);
    }

    try {
      const status = await this.lightningBackend.getInvoiceStatus(this.escrow.holdInvoice);
      if (status === "settled") {
        this.escrow.status = "FUNDED";
        this.escrow.updatedAt = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to check invoice status:", error);
      return false;
    }
  }

  async release(): Promise<boolean> {
    if (this.escrow.status !== "FUNDED") {
      throw new Error(`Cannot release escrow in ${this.escrow.status} state`);
    }

    try {
      const success = await this.lightningBackend.settleInvoice(this.escrow.holdInvoice);
      if (success) {
        this.escrow.status = "RELEASED";
        this.escrow.updatedAt = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to release escrow:", error);
      return false;
    }
  }

  async refund(): Promise<boolean> {
    if (this.escrow.status !== "FUNDED") {
      throw new Error(`Cannot refund escrow in ${this.escrow.status} state`);
    }

    try {
      const success = await this.lightningBackend.cancelInvoice(this.escrow.holdInvoice);
      if (success) {
        this.escrow.status = "REFUNDED";
        this.escrow.updatedAt = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to refund escrow:", error);
      return false;
    }
  }

  async dispute(): Promise<boolean> {
    if (this.escrow.status !== "FUNDED") {
      throw new Error(`Cannot dispute escrow in ${this.escrow.status} state`);
    }

    this.escrow.status = "DISPUTED";
    this.escrow.updatedAt = Date.now();
    return true;
  }

  getStatus(): EscrowStatus {
    return this.escrow.status;
  }

  canTransitionTo(newStatus: EscrowStatus): boolean {
    const validTransitions: Record<EscrowStatus, EscrowStatus[]> = {
      PROPOSED: ["FUNDED"],
      FUNDED: ["RELEASED", "REFUNDED", "DISPUTED"],
      RELEASED: [],
      REFUNDED: [],
      REFUND_REQUESTED: ["REFUNDED"],
      DISPUTED: ["RELEASED", "REFUNDED"],
    };

    return validTransitions[this.escrow.status]?.includes(newStatus) || false;
  }
}

// Utility functions for escrow management
export function validateEscrowAmount(amountSats: number): boolean {
  return amountSats > 0 && amountSats <= 21_000_000_000_000; // Max BTC in sats
}

export function calculateEscrowFeePercentage(feeBps: number): number {
  return feeBps / 100; // Convert basis points to percentage
}

export function formatEscrowFee(feeSats: number): string {
  return `${feeSats.toLocaleString()} sats`;
}

export function getEscrowStatusColor(status: EscrowStatus): string {
  const colors: Record<EscrowStatus, string> = {
    PROPOSED: "text-yellow-600 bg-yellow-100",
    FUNDED: "text-blue-600 bg-blue-100",
    RELEASED: "text-green-600 bg-green-100",
    REFUND_REQUESTED: "text-orange-600 bg-orange-100",
    REFUNDED: "text-red-600 bg-red-100",
    DISPUTED: "text-purple-600 bg-purple-100",
  };
  
  return colors[status] || "text-gray-600 bg-gray-100";
}

export function getEscrowStatusLabel(status: EscrowStatus): string {
  const labels: Record<EscrowStatus, string> = {
    PROPOSED: "Proposed",
    FUNDED: "Funded",
    RELEASED: "Released",
    REFUND_REQUESTED: "Refund Requested",
    REFUNDED: "Refunded",
    DISPUTED: "Disputed",
  };
  
  return labels[status] || "Unknown";
}
