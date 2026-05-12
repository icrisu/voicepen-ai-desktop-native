import type { Message } from "../../shared/types";
import { getToolHandler } from "./toolHandlers";

export function handleToolCall(
  msg: Extract<Message, { type: "EXECUTE_TOOL_CALL" }>,
  recordingTabId: number | null,
  sendResponse: (r: unknown) => void,
): true {
  const handler = getToolHandler(msg.payload.name);
  if (handler) {
    handler(msg.payload.args, { recordingTabId })
      .then(result => sendResponse({ type: "TOOL_CALL_RESULT", payload: { result } } satisfies Message))
      .catch((err: unknown) => sendResponse({ type: "TOOL_CALL_RESULT", payload: { result: null, error: String(err) } } satisfies Message));
    return true;
  }

  sendResponse({ type: "TOOL_CALL_RESULT", payload: { result: null, error: "Unknown tool" } } satisfies Message);
  return true;
}
