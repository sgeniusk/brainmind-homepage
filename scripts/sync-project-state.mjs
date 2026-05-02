import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(new URL('..', import.meta.url).pathname);
const today = new Date().toISOString().slice(0, 10);

function exists(target) {
  return fs.existsSync(target);
}

function isWorkspaceRoot(candidate) {
  return exists(path.join(candidate, 'AGENTS.md'))
    && exists(path.join(candidate, 'cortex'))
    && exists(path.join(candidate, 'nova'))
    && exists(path.join(candidate, '뇌와마음사이'));
}

function resolveWorkspaceRoot() {
  const candidates = [
    process.env.BRAINMIND_ROOT,
    path.resolve(siteRoot, '../../..'),
    path.join(process.env.HOME ?? '', 'Library/Mobile Documents/iCloud~md~obsidian/Documents/brain use'),
  ].filter(Boolean);

  const found = candidates.find(isWorkspaceRoot);
  if (!found) {
    throw new Error(`Cannot find brainmind workspace. Set BRAINMIND_ROOT. Tried: ${candidates.join(', ')}`);
  }
  return found;
}

function listFiles(root, predicate = () => true) {
  if (!exists(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.DS_Store' || entry.name === 'node_modules' || entry.name === '.git') continue;
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(entryPath);
      else if (predicate(entryPath, entry.name)) out.push(entryPath);
    }
  }
  return out.sort();
}

function countFiles(root, predicate) {
  return listFiles(root, predicate).length;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function readFrontmatter(filePath) {
  if (!exists(filePath)) return {};
  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    const value = pair[2].trim().replace(/^['"]|['"]$/g, '');
    frontmatter[pair[1]] = value;
  }
  return frontmatter;
}

function firstMatchingFile(root, predicate) {
  return listFiles(root, predicate)[0];
}

const workspaceRoot = resolveWorkspaceRoot();
const contentRoot = path.join(workspaceRoot, '뇌와마음사이');
const topicDirs = fs
  .readdirSync(contentRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{3}_/.test(entry.name))
  .map((entry) => path.join(contentRoot, entry.name))
  .sort();

const topics = topicDirs.map((topicDir) => {
  const topicFile = firstMatchingFile(topicDir, (_filePath, name) => /^TOPIC_.*\.md$/.test(name));
  const articleFile = firstMatchingFile(path.join(topicDir, '04_article'), (_filePath, name) => /^ART_.*\.md$/.test(name));
  const topicFrontmatter = topicFile ? readFrontmatter(topicFile) : {};
  const articleFrontmatter = articleFile ? readFrontmatter(articleFile) : {};
  const id = path.basename(topicDir).slice(0, 3);
  return {
    id,
    title: topicFrontmatter.title || articleFrontmatter.title || path.basename(topicDir).replace(/^\d{3}_/, '').replaceAll('_', ' '),
    status: topicFrontmatter.status || articleFrontmatter.status || 'idea',
    topicFile: topicFile ? path.relative(workspaceRoot, topicFile) : null,
    articleFile: articleFile ? path.relative(workspaceRoot, articleFile) : null,
    hasImages: exists(path.join(topicDir, '03_image')) && countFiles(path.join(topicDir, '03_image'), (_filePath, name) => /\.(png|jpe?g|webp)$/i.test(name)) > 0,
    videoCount: countFiles(path.join(topicDir, '06_video'), (_filePath, name) => /\.mp4$/i.test(name)),
  };
});

const metrics = {
  ideas: countFiles(path.join(workspaceRoot, 'cortex/00_ideas'), (_filePath, name) => /\.md$/.test(name)),
  researchSources: countFiles(path.join(workspaceRoot, 'cortex/01_research'), (_filePath, name) => /^RS_.*\.md$/.test(name)),
  researchNotes: countFiles(path.join(workspaceRoot, 'cortex/02_research_notes'), (_filePath, name) => /^RN_.*\.md$/.test(name)),
  playlists: countFiles(path.join(workspaceRoot, 'nova/playlists'), (_filePath, name) => /^PL_.*\.md$/.test(name)),
  topics: topics.length,
  articleSources: countFiles(contentRoot, (_filePath, name) => /^ART_.*\.md$/.test(name)),
  siteArticles: countFiles(path.join(siteRoot, 'src/pages/articles'), (_filePath, name) => /^article-.*\.astro$/.test(name)),
  blogPosts: countFiles(path.join(siteRoot, 'src/pages/blog'), (_filePath, name) => /\.md$/.test(name)),
  videoFiles: countFiles(contentRoot, (_filePath, name) => /\.mp4$/i.test(name)),
  imageAssets: countFiles(contentRoot, (_filePath, name) => /\.(png|jpe?g|webp)$/i.test(name)),
  systemDocs: countFiles(path.join(workspaceRoot, 'docs/systems'), (_filePath, name) => /^SYS_.*\.md$/.test(name)),
  roadmapTasks: countFiles(path.join(workspaceRoot, 'docs/roadmap/tasks'), (_filePath, name) => /^TASK_.*\.md$/.test(name)),
};

const pipelineStatuses = topics.reduce((acc, topic) => {
  acc[topic.status] = (acc[topic.status] ?? 0) + 1;
  return acc;
}, {});

const topicsWithImages = topics.filter((topic) => topic.hasImages).length;
const articleBacklog = Math.max(metrics.articleSources - metrics.siteArticles, 0);
const productionReadyTopics = (pipelineStatuses.article_complete ?? 0) + (pipelineStatuses.images_ready ?? 0);
const qualitasCriteria = countFiles(path.join(workspaceRoot, 'docs/qualitas'), (_filePath, name) => /^CRITERIA_.*\.md$/.test(name));

function generatedSnapshotFor(systemName) {
  if (systemName === 'MUSE') {
    return [
      `아이디어 ${metrics.ideas}개, RS ${metrics.researchSources}개, RN ${metrics.researchNotes}개 스캔`,
      `아티클 소스 ${metrics.articleSources}개 중 ${productionReadyTopics}개가 발행 대기권`,
      `research_complete ${pipelineStatuses.research_complete ?? 0}개, article_draft ${pipelineStatuses.article_draft ?? 0}개`,
    ];
  }

  if (systemName === 'LEO') {
    return [
      `이미지 에셋 ${metrics.imageAssets}개 확인`,
      `토픽 ${topicsWithImages}/${metrics.topics}개가 이미지 폴더를 보유`,
      `article_complete 이후 비주얼 보강 대상 ${topics.filter((topic) => !topic.hasImages && topic.status === 'article_complete').length}개`,
    ];
  }

  if (systemName === 'NOVA') {
    return [
      `홈페이지 공개 아티클 ${metrics.siteArticles}개, 블로그 ${metrics.blogPosts}개`,
      `플레이리스트 ${metrics.playlists}개와 토픽 ${metrics.topics}개 연결 가능`,
      articleBacklog > 0 ? `아티클 소스 대비 공개 백로그 ${articleBacklog}개` : '아티클 소스와 공개 아티클 수 일치',
    ];
  }

  if (systemName === 'AXON') {
    return [
      `영상 파일 ${metrics.videoFiles}개 확인`,
      `AXON 전달 상태 토픽 ${pipelineStatuses.sent_to_axon ?? 0}개`,
      `비디오가 연결된 토픽 ${topics.filter((topic) => topic.videoCount > 0).length}/${metrics.topics}개`,
    ];
  }

  if (systemName === 'QUALITAS') {
    return [
      `평가 기준 문서 ${qualitasCriteria}개 확인`,
      `개선 태스크 ${metrics.roadmapTasks}개를 품질 루프로 연결 가능`,
      `영상 완료 상태 토픽 ${pipelineStatuses.video_complete ?? 0}개`,
    ];
  }

  if (systemName === 'PULSE') {
    return [
      `시스템 문서 ${metrics.systemDocs}개, 로드맵 태스크 ${metrics.roadmapTasks}개 확인`,
      `파이프라인 상태 ${Object.keys(pipelineStatuses).length}종 관측`,
      `자동 스냅샷 생성일 ${today}`,
    ];
  }

  return [`자동 스냅샷 생성일 ${today}`];
}

const systemFiles = ['cortex', 'leo', 'nova', 'axon', 'qualitas', 'pulse'];
const systems = systemFiles.map((dir) => {
  const system = readJson(path.join(workspaceRoot, dir, 'STATUS.json'));
  return {
    ...system,
    sourceUpdated: system.updated,
    updated: today,
    snapshot: generatedSnapshotFor(system.system),
  };
});

const projectStatus = {
  generatedAt: today,
  sourceRoot: workspaceRoot,
  canonicalSite: 'nova/homepage',
  archivedSiteCandidate: 'nova/homepage-astro',
  metrics,
  pipeline: {
    statuses: pipelineStatuses,
    topics,
  },
  verification: {
    baselinePages: 51,
    canonicalBranch: 'chore/refresh-ux-harness',
  },
};

writeJson(path.join(siteRoot, 'src/data/systems.json'), systems);
writeJson(path.join(siteRoot, 'src/data/project-status.json'), projectStatus);

console.log(`Project state synced from ${workspaceRoot}`);
console.log(`- ${metrics.researchSources} RS, ${metrics.researchNotes} RN, ${metrics.articleSources} article sources`);
console.log(`- ${metrics.siteArticles} site articles, ${metrics.blogPosts} blog posts, ${metrics.videoFiles} mp4 files`);
