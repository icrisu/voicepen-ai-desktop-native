import { resolveContentContext } from "./toolContext";
import { getContentToolHandler } from "./toolHandlers";
import type { Message } from "../../shared/types";

export function handleGetToolContext(
  msg: Extract<Message, { type: "GET_TOOL_CONTEXT" }>,
  sendResponse: (r: unknown) => void,
): true {
  const contentKeys = msg.payload.keys
    .filter(e => e.executionContext === "content")
    .map(e => e.key);
  const context = resolveContentContext(contentKeys);
  sendResponse({ type: "TOOL_CONTEXT_RESULT", payload: { context } });
  return true;
}

export function handleContentToolCall(
  msg: Extract<Message, { type: "EXECUTE_CONTENT_TOOL" }>,
  sendResponse: (r: unknown) => void,
): true {
  const handler = getContentToolHandler(msg.payload.name);
  if (!handler) {
    sendResponse({ type: "CONTENT_TOOL_RESULT", payload: { result: null, error: "Unknown content tool" } });
    return true;
  }
  handler(msg.payload.args)
    .then(result => sendResponse({ type: "CONTENT_TOOL_RESULT", payload: { result } }))
    .catch((err: unknown) => sendResponse({ type: "CONTENT_TOOL_RESULT", payload: { result: null, error: String(err) } }));
  return true;
}
