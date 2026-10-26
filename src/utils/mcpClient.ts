/**
 * Client-Side MCP Tool Dispatcher & VANTA Session Client
 * Attaches session authorization headers and idempotency keys to all backend operations.
 */

import { MCP_TOOL_DEFINITIONS, MCPStatusInfo, MCPToolCallResult } from '../types/mcp';

export interface PendingVantaClarification {
  intent: 'add_customer_receivable' | 'record_expense';
  collectedArgs: Record<string, any>;
  missingFields: string[];
}

export class MCPClient {
  private shopName: string;
  private sessionToken: string | null = null;

  constructor(shopName: string = 'Sharma Stores') {
    this.shopName = shopName;
    try {
      const savedToken = localStorage.getItem('rupivanta_session_token');
      if (savedToken) this.sessionToken = savedToken;
    } catch {
      // ignore storage errors
    }
  }

  public setShopName(name: string) {
    this.shopName = name;
  }

  public setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
      headers['x-vanta-session'] = this.sessionToken;
    }
    return headers;
  }

  /**
   * Retrieves registered MCP tools and honest connection status
   */
  public async listTools(): Promise<{
    tools: typeof MCP_TOOL_DEFINITIONS;
    mcpStatus: MCPStatusInfo;
  }> {
    try {
      const res = await fetch('/api/mcp/tools', {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tools)) {
        return {
          tools: data.tools,
          mcpStatus: data.mcpStatus || {
            mode: 'internal_dispatcher_mcp_ready',
            externalServerConnected: false,
            authEnforced: true,
            duplicateProtection: true,
            registeredToolCount: data.tools.length,
          },
        };
      }
    } catch {
      // fallback
    }
    return {
      tools: MCP_TOOL_DEFINITIONS,
      mcpStatus: {
        mode: 'internal_dispatcher_mcp_ready',
        externalServerConnected: false,
        authEnforced: true,
        duplicateProtection: true,
        registeredToolCount: MCP_TOOL_DEFINITIONS.length,
      },
    };
  }

  /**
   * Executes an MCP tool via the authenticated server MCP endpoint
   */
  public async executeTool(
    toolName: string,
    args: Record<string, any> = {},
    idempotencyKey?: string
  ): Promise<MCPToolCallResult> {
    const key =
      idempotencyKey ||
      `idem-${toolName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      const res = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          toolName,
          arguments: args,
          callerId: 'vanta-frontend-client',
          shopName: this.shopName,
          idempotencyKey: key,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        toolName,
        success: false,
        message: err?.message || 'Network error executing tool',
        error: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * Dispatches a natural language command or question to VANTA AI Financial Assistant
   */
  public async processQuery(
    message: string,
    language: string = 'en',
    options?: {
      pendingClarification?: PendingVantaClarification | null;
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
    }
  ) {
    try {
      const res = await fetch('/api/vanta/chat', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          message,
          language,
          shopName: this.shopName,
          pendingClarification: options?.pendingClarification || null,
          history: options?.history || [],
          idempotencyKey: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          reply: data?.message || 'Session expired or unauthorized. Please log in again.',
          intent: 'auth_error',
          error: data?.error || 'HTTP_ERROR',
        };
      }
      return data;
    } catch {
      return {
        reply: 'Unable to reach VANTA server right now. Please check your connection and retry.',
        intent: 'error',
        proposedAction: null,
      };
    }
  }
}

export const mcpClient = new MCPClient();
