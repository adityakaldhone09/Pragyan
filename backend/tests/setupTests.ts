// global test setup
process.env.NODE_ENV = 'test';
// Ensure a predictable AI test mode
process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'local';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

jest.setTimeout(20000);
// cleanup helpers
afterEach(() => {
	jest.clearAllMocks();
	try { jest.useRealTimers(); } catch (e) {}
});

// Provide a lightweight mock for AI provider to keep tests deterministic
jest.mock('@/services/aiProvider', () => {
	let currentProvider: any = null;
	const mockFacade: any = {
		setProvider: (p: any) => { currentProvider = p; },
		getProviderName: () => (currentProvider ? currentProvider.getProviderName() : 'local'),
		getModel: () => (currentProvider ? currentProvider.getModel() : 'test'),
		getRuntime: () => ({ provider: (currentProvider ? currentProvider.getProviderName() : 'local'), model: (currentProvider ? currentProvider.getModel() : 'test') }),
		generateText: async (prompt: string, opts?: any) => {
			if (currentProvider && typeof currentProvider.generateText === 'function') return currentProvider.generateText(prompt, opts);
			return 'test-ai-response';
		},
		generateJsonRaw: async (prompt: string, opts?: any) => {
			if (currentProvider && typeof currentProvider.generateJsonRaw === 'function') return currentProvider.generateJsonRaw(prompt, opts);
			return '{}';
		},
		generateJsonValidated: async (prompt: string, validateFn: any, opts?: any) => {
			if (currentProvider && typeof currentProvider.generateJsonValidated === 'function') return currentProvider.generateJsonValidated(prompt, validateFn, opts);
			return validateFn({});
		},
	};

	return { aiProvider: mockFacade, default: mockFacade };
});

// Mock ai-layers used by some services
jest.mock('@/services/ai-layers', () => ({
	aiLayers: {
		generateCreative: jest.fn().mockResolvedValue('creative-response'),
		generateStructuredJson: jest.fn().mockResolvedValue('{}'),
	}
}));

afterAll(() => {
	// ensure timers are cleared
	jest.clearAllTimers && jest.clearAllTimers();
});
