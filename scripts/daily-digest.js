const { Octokit } = require("@octokit/rest");
const nodemailer = require("nodemailer");

const octokit = new Octokit({ auth: process.env.GH_TOKEN });
const ORG = process.env.GH_ORG;

async function getOrgRepos() {
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org: ORG,
    per_page: 100,
  });
  return repos.map(r => r.name);
}

async function getRepoActivity(repo, since) {
  const [commits, prs, issues, releases] = await Promise.all([
    octokit.repos.listCommits({ owner: ORG, repo, since }).catch(() => ({ data: [] })),
    octokit.pulls.list({ owner: ORG, repo, state: "all", sort: "updated", direction: "desc", per_page: 50 }),
    octokit.issues.listForRepo({ owner: ORG, repo, state: "all", sort: "updated", direction: "desc", per_page: 50 }),
    octokit.repos.listReleases({ owner: ORG, repo, per_page: 10 }).catch(() => ({ data: [] })),
  ]);

  const sinceDate = new Date(since);
  const recentPRs = prs.data.filter(p => new Date(p.updated_at) > sinceDate);
  const recentIssues = issues.data.filter(i => !i.pull_request && new Date(i.updated_at) > sinceDate);
  const recentReleases = releases.data.filter(r => new Date(r.created_at) > sinceDate);

  return {
    repo,
    commits: commits.data,
    prs: recentPRs,
    issues: recentIssues,
    releases: recentReleases,
  };
}

function buildRawSummary(activity) {
  let text = "";
  for (const a of activity) {
    if (!a.commits.length && !a.prs.length && !a.issues.length && !a.releases.length) continue;
    text += `\n### ${a.repo}\n`;
    if (a.commits.length) {
      text += `Commits:\n`;
      a.commits.forEach(c => {
        text += `- ${c.commit.message.split("\n")[0]} (${c.commit.author.name})\n`;
      });
    }
    if (a.prs.length) {
      text += `Pull Requests:\n`;
      a.prs.forEach(p => {
        text += `- #${p.number} [${p.state}${p.merged_at ? "/merged" : ""}] ${p.title} by ${p.user.login}\n`;
      });
    }
    if (a.issues.length) {
      text += `Issues:\n`;
      a.issues.forEach(i => {
        text += `- #${i.number} [${i.state}] ${i.title}\n`;
      });
    }
    if (a.releases.length) {
      text += `Releases:\n`;
      a.releases.forEach(r => {
        text += `- ${r.tag_name}: ${r.name || ""}\n`;
      });
    }
  }
  return text || "No activity in the last 24 hours.";
}

async function generateTechnicalDigest(rawSummary) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `You are writing a daily engineering digest for a startup founder/tech lead. ` +
          `Given this raw GitHub activity across the team's repos, write a concise, technical summary. ` +
          `Group by repo. For each notable change, briefly explain WHAT changed and WHY it likely matters ` +
          `(architecture, risk, dependencies, etc). Flag anything that looks risky (large PRs, long-open ` +
          `issues, failing patterns). Use plain text with simple headers, no markdown tables.\n\n` +
          `Raw activity:\n${rawSummary}`,
      }],
    }),
  });
  const data = await response.json();
  return data.content.map(c => c.text || "").join("\n");
}

async function sendEmail(subject, body) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO,
    subject,
    text: body,
  });
}

(async () => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const repos = await getOrgRepos();
  const activity = await Promise.all(repos.map(r => getRepoActivity(r, since)));
  const raw = buildRawSummary(activity);
  const digest = await generateTechnicalDigest(raw);
  await sendEmail(`Daily Engineering Digest — ${new Date().toDateString()}`, digest);
  console.log("Digest sent.");
})().catch(err => {
  console.error(err);
  process.exit(1);
});
