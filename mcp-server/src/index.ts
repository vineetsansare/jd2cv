#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const rawUrl = (process.env.JD2CV_API_URL || "https://toolsby.vineetsansare.com").replace(/\/+$/, "");
const API_BASE_URL = rawUrl.endsWith("/api/agent") ? rawUrl : `${rawUrl}/api/agent`;
const API_KEY = process.env.JD2CV_API_KEY || "";

if (!API_KEY) {
  console.error("Warning: JD2CV_API_KEY environment variable is not set. Requests will fail authentication.");
}

async function fetchFromJD2CV(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `HTTP ${response.status} ${response.statusText}`;
    throw new Error(`JD2CV API Error: ${errorMsg}`);
  }

  return data;
}

// Initialize MCP Server
const server = new McpServer({
  name: "jd2cv-connector",
  version: "1.0.0"
});

// Tool 1: get_user_base_cv
server.tool(
  "get_user_base_cv",
  "Fetches the candidate's master resume and career history currently stored in JD2CV.",
  {},
  async () => {
    try {
      const result = await fetchFromJD2CV("/base-cv");
      if (!result.hasBaseCV || !result.cv) {
        return {
          content: [
            {
              type: "text",
              text: "No master CV is currently stored on your JD2CV account. Please visit https://toolsby.vineetsansare.com/jd2cv to upload your baseline resume."
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `### Master Resume: ${result.cv.filename} (${result.cv.wordCount} words)\n*Uploaded: ${new Date(result.cv.uploadedAt).toLocaleDateString()}*\n\n\`\`\`text\n${result.cv.extractedText}\n\`\`\``
          }
        ]
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to fetch base CV: ${err.message}` }]
      };
    }
  }
);

// Tool 2: extract_job_from_url
server.tool(
  "extract_job_from_url",
  "Fetches and sanitizes clean text from a public job posting or company About Us URL.",
  {
    url: z.string().url().describe("The web URL of the job posting or company page")
  },
  async ({ url }) => {
    try {
      const result = await fetchFromJD2CV("/scrape", {
        method: "POST",
        body: JSON.stringify({ url })
      });

      return {
        content: [
          {
            type: "text",
            text: `### Extracted Job Content from ${url}\n**Title:** ${result.title || "Job Posting"}\n\n${result.text}`
          }
        ]
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to extract URL: ${err.message}. If the job board uses anti-bot shields (e.g. LinkedIn, Workday), please copy and paste the job description text directly.`
          }
        ]
      };
    }
  }
);

// Tool 3: generate_tailored_cv
server.tool(
  "generate_tailored_cv",
  "Rewrites the candidate's resume for a target Job Description using JD2CV's executive ATS engine. Computes ATS score, keyword alignment, and creates a 2-page print-ready CV and cover letter.",
  {
    jobDescription: z.string().optional().describe("The text of the target Job Description"),
    url: z.string().optional().describe("Optional URL to the job posting (if raw text not provided)"),
    aspirations: z.string().optional().describe("Optional career aspirations or specific focus to highlight"),
    targetLength: z.enum(["1-page", "2-page", "comprehensive"]).default("2-page").describe("Strict physical print ceiling"),
    redactPii: z.boolean().optional().default(false).describe("GDPR Data Minimization: Mask candidate phone, email, and street address before AI processing")
  },
  async ({ jobDescription, url, aspirations, targetLength, redactPii }) => {
    try {
      const payload: Record<string, any> = {
        aspirations,
        targetLength,
        redactPii
      };

      if (jobDescription) payload.jobDescription = jobDescription;
      if (url) payload.url = url;

      const result = await fetchFromJD2CV("/generate", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const matchedKw = result.atsAnalysis?.matchedKeywords?.slice(0, 12).join(", ") || "None";
      const missingKw = result.atsAnalysis?.missingKeywords?.slice(0, 8).join(", ") || "None";
      const actionItems = result.atsAnalysis?.actionItems?.map((a: string) => `- ${a}`).join("\n") || "";
      const privacyNotice = result.privacyNote ? `\n*🛡️ Privacy Note: ${result.privacyNote}*\n` : "";

      const summaryText = [
        `# JD2CV Tailored CV Generated`,
        `**ATS Compatibility Score:** ${result.atsScore}/100`,
        `**Target Page Format:** ${targetLength}`,
        privacyNotice,
        `**Matched Keywords:** ${matchedKw}`,
        `**Remaining Gaps:** ${missingKw}`,
        ``,
        `### Recommendations & Impact Actions:`,
        actionItems,
        ``,
        `---`,
        `### 🚀 Next Steps for Candidate:`,
        `Click here to open, edit, and export your 2-page print-ready PDF:`,
        `**[Open in JD2CV Dashboard](${result.deepLinkUrl})**`,
        ``,
        `---`,
        `### Executive Cover Letter:`,
        result.coverLetter || "N/A",
        ``,
        `---`,
        `### Tailored CV Markdown:`,
        result.cvMarkdown
      ].join("\n");

      return {
        content: [{ type: "text", text: summaryText }]
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to generate customized CV: ${err.message}` }]
      };
    }
  }
);

// Tool 4: get_user_profile
server.tool(
  "get_user_profile",
  "Checks the user's subscription tier and generation quota on JD2CV.",
  {},
  async () => {
    try {
      const profile = await fetchFromJD2CV("/profile");
      return {
        content: [
          {
            type: "text",
            text: `### JD2CV User Profile\n- **User ID:** ${profile.id}\n- **Email:** ${profile.email}\n- **Plan:** ${profile.plan.toUpperCase()}\n- **Generations Used:** ${profile.generationCount}\n- **Generations Remaining:** ${profile.quotaRemaining}`
          }
        ]
      };
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to fetch profile: ${err.message}` }]
      };
    }
  }
);

// Connect via Stdio Transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting JD2CV MCP Server:", err);
  process.exit(1);
});
