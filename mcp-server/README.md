# JD2CV Claude Model Context Protocol (MCP) Server

Connects **Claude Desktop** and **Claude Code** to **JD2CV** to effortlessly create ATS-optimized resumes and cover letters directly inside your chats.

---

## 🌟 Capabilities
- **`get_user_base_cv`**: Instantly fetches your master resume stored in JD2CV.
- **`extract_job_from_url`**: Extracts clean job descriptions and requirements from public URLs.
- **`generate_tailored_cv`**: Invokes JD2CV's executive resume rewriting engine, applies strict page limits (1-page or 2-page print ceiling), eliminates career gaps, generates an ATS keyword compatibility audit, and provides a direct deep link to preview and export your PDF.
- **`get_user_profile`**: Inspects your current subscription tier and generation quota.

---

## 🛠️ Quickstart with Claude Desktop

### 1. Generate a Personal Access Token in JD2CV
1. Sign in to your JD2CV dashboard at `https://toolsby.vineetsansare.com/jd2cv`.
2. Generate an Agent Token (`jd2cv_sk_...`) or obtain your session token.

### 2. Configure Claude Desktop
Edit your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the `jd2cv` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "jd2cv": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/CV-builder/mcp-server/dist/index.js"],
      "env": {
        "JD2CV_API_KEY": "jd2cv_sk_YOUR_PERSONAL_ACCESS_TOKEN",
        "JD2CV_API_URL": "https://toolsby.vineetsansare.com/api/agent"
      }
    }
  }
}
```

> If testing locally with a local backend: set `"JD2CV_API_URL": "http://localhost:3001/api/agent"`.

### 3. Restart Claude Desktop
Once saved, restart Claude Desktop. The hammer icon will show the new JD2CV tools available in your chat!

---

## 💬 Example Prompts in Claude Desktop

- *"Fetch my base resume from JD2CV and tailor it for this role: https://careers.airbnb.com/positions/12345"*
- *"Here is a job description: [pasted JD]. Generate a tailored 2-page CV using JD2CV and show me the ATS audit score."*
- *"Check my remaining JD2CV generation quota."*
