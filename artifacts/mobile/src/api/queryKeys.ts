export const queryKeys = {
  proposals: {
    all: ['proposals'] as const,
    list: (filters: Record<string, unknown>) => ['proposals', 'list', filters] as const,
    detail: (id: string) => ['proposals', 'detail', id] as const,
    board: (filters: Record<string, unknown>) => ['proposals', 'board', filters] as const,
    contextBoard: (grouping: 'station' | 'program', selectedId: string | undefined, filters: Record<string, unknown>) => ['proposals', 'context-board', grouping, selectedId, filters] as const,
    contextPrograms: ['proposals', 'context-programs'] as const,
    programBoard: (filters: Record<string, unknown>) => ['proposals', 'program-board', filters] as const,
    stationBoard: (filters: Record<string, unknown>) => ['proposals', 'station-board', filters] as const,
    timeline: (id: string) => ['proposals', 'timeline', id] as const,
    versions: (id: string) => ['proposals', 'versions', id] as const,
  },
  advertisers: {
    all: ['advertisers'] as const,
    list: (filters: Record<string, unknown>) => ['advertisers', 'list', filters] as const,
    detail: (id: string) => ['advertisers', 'detail', id] as const,
  },
  leadSources: {
    all: ['lead-sources'] as const,
    list: (filters: Record<string, unknown> = {}) => ['lead-sources', 'list', filters] as const,
    metrics: ['lead-sources', 'metrics'] as const,
  },
  recall: {
    all: ['recall-reminders'] as const,
    list: (filters: Record<string, unknown> = {}) => ['recall-reminders', 'list', filters] as const,
    count: ['recall-reminders', 'count'] as const,
  },
  stations: {
    all: ['stations'] as const,
    detail: (id: string) => ['stations', 'detail', id] as const,
    presentation: (id: string) => ['stations', 'presentation', id] as const,
    deletionImpact: (id: string) => ['stations', 'deletion-impact', id] as const,
  },
  contracts: {
    list: (filters: Record<string, unknown> = {}) => ['contracts', 'list', filters] as const,
    summary: (month?: string) => ['contracts', 'summary', month] as const,
    forecast: (from?: string, months?: number) => ['contracts', 'forecast', from, months] as const,
    eligible: ['contracts', 'eligible'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (filters: Record<string, unknown> = {}) => ['products', 'list', filters] as const,
  },
  users: {
    all: ['users'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
};
