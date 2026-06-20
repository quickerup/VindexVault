/**
 * VindexVault Threat Intelligence Core Schema
 * This defines the shared semantic model across contracts, worker, and SDK.
 */

export type Address = string;
export type TelegramHandle = string;
export type Domain = string;

export enum ConfidenceLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  VERIFIED = 3
}

export enum ActorType {
  WALLET = "wallet",
  TELEGRAM_USER = "telegram_user",
  BOT = "bot",
  DOMAIN = "domain",
  MINI_APP = "mini_app",
  TOKEN = "token"
}

export interface Actor {
  id: string;
  type: ActorType;
  handle?: TelegramHandle;
  address?: Address;
  domain?: Domain;
}

export interface Evidence {
  id: string;
  type: "screenshot" | "tx" | "log" | "message" | "url";
  uri: string;
  hash?: string;
  timestamp: number;
}

export interface ThreatReport {
  id: string;
  title: string;
  description: string;
  reporter: Actor;
  suspects: Actor[];
  evidence: Evidence[];
  confidence: ConfidenceLevel;
  tags: string[];
  createdAt: number;
}

export interface GraphLink {
  from: string;
  to: string;
  relation:
    | "impersonates"
    | "controls"
    | "hosts"
    | "paid_by"
    | "associated_with";
  weight: number;
}

export interface ReputationScore {
  actorId: string;
  score: number;
  reportsSubmitted: number;
  reportsValidated: number;
  reportsRejected: number;
}
