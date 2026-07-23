export * from './types';
export { projectService } from './projects';
export { sourceService } from './sources';
export { claimService } from './claims';
export { conceptService } from './concepts';
export { associationService } from './associations';
export { conflictService } from './conflicts';
export { interpretationService } from './interpretations';
export { researchQuestionService } from './researchQuestions';
export { hypothesisService } from './hypotheses';
export { dashboardService } from './dashboard';
export { tradeService } from './trades';
export { tradeImportExportService } from './tradeImportExport';
export { marketStructureService } from './marketStructures';
export { searchService } from './search';
export { collectorService } from './collectors';
export { statisticsService } from './statistics';
export { similarityService } from './similarity';
export { decisionService } from './decision';
export { learningService } from './learning';
export { macroService } from './macro';
export { mt5Service } from './mt5';
export { tradingviewService } from './tradingview';
export { tradeMemoryService } from './tradeMemory';
export { knowledgeRuleService } from './knowledgeRules';
export { knowledgeGraphService } from './knowledgeGraph';
export { analystService } from './analyst';
export { researchService } from './research';
export { replayService } from './replay';
export { knowledgeService } from './knowledge';
export { traderIntelligenceService } from './traderIntelligence';
export { strategyService } from './strategies';
export { portfolioService } from './portfolio';

// Intelligence Agents (Phase 4.6)
export * as agentsApi from './agents';

// Brain & AI
export * as brainApi from './brain';
export { aiFoundationService } from './aiFoundation';

// Automation, Broker, Copilot
export * as automationApi from './automation';
export * as brokerApi from './broker';
export * as copilotApi from './copilot';

// Domain-specific API modules
export { marketIntelService } from './marketIntelligence';
export { obsidianService } from './obsidian';
export * as planningApi from './planning';
export { quantResearchService } from './quantResearch';
export { riskService } from './risk';