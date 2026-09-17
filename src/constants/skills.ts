import { AgentSkill, TrainingExample, KnowledgeDoc, AgentTrainingProfile } from '../types';

export const DEFAULT_BUILTIN_SKILLS: AgentSkill[] = [];
export const DEFAULT_TRAINING_EXAMPLES: TrainingExample[] = [];
export const DEFAULT_KNOWLEDGE_DOCS: KnowledgeDoc[] = [];
export const DEFAULT_TRAINING_PROFILE: AgentTrainingProfile = {
  persona: 'senior-architect',
  customSystemInstructions: '',
  strictRules: [],
  teamConventions: '',
  enableFewShotLearning: true,
  enableProjectKnowledge: true,
  temperature: 0.7
};
