# Architecture Specification

## High-Level Flow

Report → Ingestion → Scoring → Reputation → Graph → Clusters → Detection → Alerts → Chain

---

## Core Principle

Every piece of intelligence is treated as a **graph mutation event**.

---

## System Boundaries

### Off-chain
- graph processing
- clustering
- detection
- alert streaming

### On-chain
- anchored intelligence hashes
- registry commitments
- tokenized incentives

---

## Failure Modes

- graph fragmentation if ingestion is inconsistent
- Sybil resistance degradation under adversarial load
- chain anchoring latency under network congestion

---

## Scaling Model

Horizontal scaling via:
- partitioned graph shards
- event-based ingestion streams
- SDK-based read replication