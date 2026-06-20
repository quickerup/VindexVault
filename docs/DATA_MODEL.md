# Data Model

## Node Schema

{
  id: string,
  type: "actor" | "report" | "asset",
  label: string
}

---

## Edge Schema

{
  from: string,
  to: string,
  type: string
}

---

## Alert Schema

{
  id: string,
  timestamp: number,
  actors: string[],
  reports: string[],
  risk: number,
  severity: string,
  flags: string[]
}