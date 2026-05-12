import Dexie, { type Table } from "dexie";
import type { EchoWriteHistoryEntry } from "./types";

class HistoryDatabase extends Dexie {
  echowrite!: Table<EchoWriteHistoryEntry>;

  constructor() {
    super("OdinHistory");
    this.version(1).stores({
      echowrite: "id, timestamp",
    });
  }
}

export const historyDb = new HistoryDatabase();
