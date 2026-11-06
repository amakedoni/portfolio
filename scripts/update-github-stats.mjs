#!/usr/bin/env node
// Writes assets/data/github.json from the public GitHub API so the site never shows invented numbers.
// Needs a token in GITHUB_TOKEN (the Actions default works) or a logged-in `gh` CLI.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOGIN = 'amakedoni';
const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'data', 'github.json');
const token = process.env.GITHUB_TOKEN || execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();

async function api(path, init = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'portfolio-stats', ...init.headers },
  });
  if (!response.ok) throw new Error(`GitHub API ${path} returned ${response.status}`);
  return response.json();
}

async function graphql(query) {
  const body = await api('/graphql', { method: 'POST', body: JSON.stringify({ query }) });
  if (body.errors) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

const now = new Date();
const year = now.getUTCFullYear();
const { user } = await graphql(`query {
  user(login: "${LOGIN}") {
    pastYear: contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
    thisYear: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${now.toISOString()}") {
      totalCommitContributions
    }
  }
}`);

const repos = [];
for (let page = 1; ; page += 1) {
  const batch = await api(`/users/${LOGIN}/repos?per_page=100&type=owner&page=${page}`);
  repos.push(...batch);
  if (batch.length < 100) break;
}

// Language share by bytes across original (non-fork) public repositories.
const bytes = {};
for (const repo of repos.filter((item) => !item.fork)) {
  const languages = await api(`/repos/${LOGIN}/${repo.name}/languages`);
  for (const [name, size] of Object.entries(languages)) bytes[name] = (bytes[name] || 0) + size;
}
const totalBytes = Object.values(bytes).reduce((sum, size) => sum + size, 0) || 1;
const languages = Object.entries(bytes)
  .sort((a, b) => b[1] - a[1])
  .map(([name, size]) => ({ name, share: Number(((size / totalBytes) * 100).toFixed(1)) }));

const LEVELS = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const weeks = user.pastYear.contributionCalendar.weeks.map((week) => week.contributionDays.map((day) => ({
  date: day.date,
  count: day.contributionCount,
  level: LEVELS[day.contributionLevel] ?? 0,
})));
const days = weeks.flat();

let longestStreak = 0;
let run = 0;
for (const day of days) {
  run = day.count > 0 ? run + 1 : 0;
  longestStreak = Math.max(longestStreak, run);
}

const stats = {
  generatedAt: now.toISOString(),
  login: LOGIN,
  publicRepos: repos.length,
  commitsThisYear: user.thisYear.totalCommitContributions,
  year,
  contributionsPastYear: user.pastYear.contributionCalendar.totalContributions,
  activeDaysPastYear: days.filter((day) => day.count > 0).length,
  longestStreakPastYear: longestStreak,
  languageCount: languages.filter((language) => language.share >= 0.1).length,
  languages: languages.slice(0, 6),
  weeks,
};

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(stats)}\n`);
console.log(`github.json: ${stats.publicRepos} repos, ${stats.commitsThisYear} commits in ${year}, ${stats.contributionsPastYear} contributions, ${stats.activeDaysPastYear} active days, ${stats.longestStreakPastYear}-day longest streak`);
console.log(languages.slice(0, 6).map((language) => `${language.name} ${language.share}%`).join(', '));
