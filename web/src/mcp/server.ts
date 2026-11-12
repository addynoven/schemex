#!/usr/bin/env node

/**
 * Scheme Navigator — Official Model Context Protocol (MCP) Server
 *
 * Exposes three core welfare tools:
 * 1. search_schemes: Discover central and state government schemes
 * 2. check_eligibility: Evaluate citizen facts against deterministic rules
 * 3. get_scheme_details: Retrieve scheme benefits, summary, and statutory documents
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  executeSearchSchemes,
  executeGetSchemeDocuments,
  executeCheckEligibility,
} from "../lib/chat-tools.js";

// Initialize official MCP Server
const server = new Server(
  {
    name: "scheme-navigator-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Declare tools advertised to MCP clients (Claude Desktop, Cursor, Antigravity)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_schemes",
        description:
          "Search Indian central and state government welfare schemes by keyword, state, or category (e.g. Agriculture, Healthcare, Education, Social Welfare).",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search keyword e.g. 'farmer', 'pension', 'scholarship', 'tractor'",
            },
            state: {
              type: "string",
              description: "Indian state name e.g. 'Madhya Pradesh', 'Maharashtra', or 'ALL_INDIA'",
            },
            category: {
              type: "string",
              description: "Welfare sector e.g. 'Agriculture', 'Education', 'Healthcare', 'Social Welfare'",
            },
          },
        },
      },
      {
        name: "check_eligibility",
        description:
          "Evaluate a citizen's eligibility for a specific government scheme using the deterministic rule engine (income thresholds, age restrictions, state residency, and occupation).",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "Exact scheme slug e.g. 'pm-kisan-samman-nidhi', 'mp-kisan-kalyan'",
            },
            age: {
              type: "number",
              description: "Citizen age in years",
            },
            state: {
              type: "string",
              description: "Citizen state of residence",
            },
            income: {
              type: "number",
              description: "Annual family income in INR",
            },
            occupation: {
              type: "string",
              description: "Citizen occupation e.g. 'farmer', 'student', 'artisan'",
            },
            gender: {
              type: "string",
              description: "Gender e.g. 'female', 'male'",
            },
            is_bpl: {
              type: "boolean",
              description: "Whether the family holds a Below Poverty Line (BPL) card",
            },
          },
          required: ["slug"],
        },
      },
      {
        name: "get_scheme_details",
        description:
          "Retrieve verified statutory document requirements and application details for one or more scheme slugs.",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "Scheme slug e.g. 'pm-kisan-samman-nidhi'",
            },
          },
          required: ["slug"],
        },
      },
    ],
  };
});

// Dispatch tool executions
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_schemes") {
      const q = typeof args?.query === "string" ? args.query : undefined;
      const state = typeof args?.state === "string" ? args.state : undefined;
      const category = typeof args?.category === "string" ? args.category : undefined;

      const result = await executeSearchSchemes(q, state, category);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "check_eligibility") {
      const slug = String(args?.slug || "");
      const age = typeof args?.age === "number" ? args.age : undefined;
      const state = typeof args?.state === "string" ? args.state : undefined;
      const income = typeof args?.income === "number" ? args.income : undefined;
      const occupation = typeof args?.occupation === "string" ? args.occupation : undefined;
      const gender = typeof args?.gender === "string" ? args.gender : undefined;
      const is_bpl = typeof args?.is_bpl === "boolean" ? args.is_bpl : undefined;

      const result = await executeCheckEligibility({
        slug,
        age,
        state,
        income,
        occupation,
        gender,
        is_bpl,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === "get_scheme_details") {
      const slug = String(args?.slug || "");
      const result = await executeGetSchemeDocuments([slug]);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ status: "error", error: `Unknown tool: ${name}` }),
        },
      ],
      isError: true,
    };
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            status: "error",
            error: err?.message || "Internal tool execution error",
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 [Scheme Navigator MCP] Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal MCP Server Error:", err);
  process.exit(1);
});
