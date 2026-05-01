import fs from 'node:fs';
import path from 'node:path';

const siteRoot = path.resolve(new URL('..', import.meta.url).pathname);
const contractPath = path.join(siteRoot, 'src/data/harness-contract.json');
const projectStatusPath = path.join(siteRoot, 'src/data/project-status.json');
const errors = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    errors.push(`${path.relative(siteRoot, filePath)} is missing or invalid JSON`);
    return null;
  }
}

const contract = readJson(contractPath);
const projectStatus = readJson(projectStatusPath);

const requiredAgents = ['MUSE', 'LEO', 'NOVA', 'AXON', 'QUALITAS', 'PULSE'];
const requiredGates = ['G1', 'G2', 'G3', 'G4', 'G5'];
const requiredCommands = ['sync:status', 'build', 'check-blog-integrity', 'check:project', 'check:a11y', 'check:harness'];
const requiredStatuses = [
  'idea',
  'researching',
  'research_complete',
  'article_draft',
  'article_review',
  'article_complete',
  'images_ready',
  'published',
  'sent_to_axon',
  'video_draft',
  'video_review',
  'video_complete',
];

if (contract) {
  if (contract.framework !== 'Deep Agents') {
    errors.push('harness-contract.framework must be "Deep Agents"');
  }

  if (contract.canonicalSite !== 'nova/homepage') {
    errors.push('harness-contract.canonicalSite must be nova/homepage');
  }

  const agentNames = new Set((contract.agents ?? []).map((agent) => agent.name));
  for (const agent of requiredAgents) {
    if (!agentNames.has(agent)) errors.push(`harness-contract.agents must include ${agent}`);
  }

  const gateIds = new Set((contract.humanGates ?? []).map((gate) => gate.id));
  for (const gate of requiredGates) {
    if (!gateIds.has(gate)) errors.push(`harness-contract.humanGates must include ${gate}`);
  }

  const commands = new Set(contract.verificationCommands ?? []);
  for (const command of requiredCommands) {
    if (!commands.has(command)) errors.push(`harness-contract.verificationCommands must include ${command}`);
  }

  const statuses = new Set(contract.statuses ?? []);
  for (const status of requiredStatuses) {
    if (!statuses.has(status)) errors.push(`harness-contract.statuses must include ${status}`);
  }

  if (!contract.memory?.persistentPaths?.includes('/memories/')) {
    errors.push('harness-contract.memory.persistentPaths must include /memories/');
  }

  if (!contract.filesystem?.root || !contract.filesystem?.writeBoundaries) {
    errors.push('harness-contract.filesystem must define root and writeBoundaries');
  }
}

if (contract && projectStatus) {
  const contractStatuses = new Set(contract.statuses ?? []);
  for (const topic of projectStatus.pipeline?.topics ?? []) {
    if (!contractStatuses.has(topic.status)) {
      errors.push(`topic ${topic.id} uses status "${topic.status}" outside harness contract`);
    }
  }
}

if (errors.length > 0) {
  console.error('Harness contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Harness contract check passed.');
