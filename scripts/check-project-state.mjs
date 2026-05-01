import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(new URL('..', import.meta.url).pathname);
const projectStatusPath = path.join(siteRoot, 'src/data/project-status.json');
const systemsPath = path.join(siteRoot, 'src/data/systems.json');

const errors = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${path.relative(siteRoot, filePath)} is missing or invalid JSON`);
    return null;
  }
}

const projectStatus = readJson(projectStatusPath);
const systems = readJson(systemsPath);

if (projectStatus) {
  const requiredMetrics = ['ideas', 'researchSources', 'researchNotes', 'playlists', 'topics', 'articleSources', 'siteArticles', 'blogPosts', 'videoFiles', 'imageAssets', 'roadmapTasks'];
  for (const key of requiredMetrics) {
    if (!Number.isInteger(projectStatus.metrics?.[key])) {
      errors.push(`project-status.metrics.${key} must be an integer`);
    }
  }

  if (!Array.isArray(projectStatus.pipeline?.topics) || projectStatus.pipeline.topics.length === 0) {
    errors.push('project-status.pipeline.topics must contain discovered topic records');
  }

  if (!projectStatus.generatedAt || !/^\d{4}-\d{2}-\d{2}$/.test(projectStatus.generatedAt)) {
    errors.push('project-status.generatedAt must be YYYY-MM-DD');
  }
}

if (systems) {
  if (!Array.isArray(systems) || systems.length !== 6) {
    errors.push('systems.json must contain the six production/meta systems');
  } else {
    for (const system of systems) {
      if (!system.system || !system.updated) {
        errors.push('every system entry must include system and updated');
      }
      if (!Array.isArray(system.snapshot) || system.snapshot.length === 0) {
        errors.push(`system ${system.system ?? 'unknown'} must include generated snapshot facts`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Project state check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Project state check passed.');
