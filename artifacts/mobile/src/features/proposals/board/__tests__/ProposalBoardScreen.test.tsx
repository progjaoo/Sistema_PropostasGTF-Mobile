import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import type { ProposalProgressBoard } from '@/src/api/contracts';
import { ProposalBoardScreen } from '../ProposalBoardScreen';

const mockStation = {
  id: 'station-1',
  name: 'Mosaico',
  primaryColor: '#427EFF',
  active: true,
  usesPrograms: true,
  viewerCanCreateProposals: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockBoard: ProposalProgressBoard = {
  programs: [{
    id: 'program-1',
    name: 'Jornal',
    stationId: mockStation.id,
    stationName: mockStation.name,
    proposals: [{
      id: 'proposal-1',
      status: 'SENT',
      currentStep: 'LEAD_CREATED',
      viewerCanEdit: true,
      stationId: mockStation.id,
      proposalTypeName: 'Patrocínio',
      advertiserName: 'Acme',
      primaryColor: '#427EFF',
      stationName: mockStation.name,
      createdByName: 'Carlos',
      updatedAt: '2026-01-01T00:00:00.000Z',
      investValue: '1000',
      products: [],
    }],
  }],
};

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }) }));

jest.mock('@/src/store/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'seller-1', name: 'Carlos', email: 'carlos@example.com', role: 'COMERCIAL', active: true } }),
}));

jest.mock('@/components/ToastProvider', () => ({ useToast: () => ({ showToast: jest.fn() }) }));

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { programs: [] }, isLoading: false, isError: false, isFetching: false, refetch: jest.fn() }),
  useMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

jest.mock('../useContextualProposalBoard', () => ({
  useContextualProposalBoard: () => ({
    stationsQuery: { data: [mockStation], isLoading: false, isError: false, isFetching: false, refetch: jest.fn() },
    programsQuery: { data: mockBoard, isLoading: false, isError: false, isFetching: false, refetch: jest.fn() },
    boardQuery: { data: mockBoard, isLoading: false, isError: false, isFetching: false, refetch: jest.fn() },
    board: mockBoard,
  }),
}));

jest.mock('../BoardContextToolbar', () => ({
  BoardContextToolbar: ({ contextLabel }: { contextLabel: string }) => require('react').createElement(require('react-native').Text, null, contextLabel),
}));

jest.mock('../ActiveProposalFilters', () => ({ ActiveProposalFilters: () => null }));
jest.mock('../ProposalSearchOverlay', () => ({ ProposalSearchOverlay: () => null }));
jest.mock('../ProposalFiltersSheet', () => ({ ProposalFiltersSheet: () => null }));
jest.mock('../ProposalContextSheet', () => ({ ProposalContextSheet: () => null }));
jest.mock('../MoveProposalSheet', () => ({ MoveProposalSheet: () => null }));
jest.mock('../ContextualProposalKanban', () => ({
  ContextualProposalKanban: () => require('react').createElement(
    require('react-native').View,
    { testID: 'proposal-kanban-focused' },
    require('react').createElement(require('react-native').Text, null, 'Lead criado'),
  ),
}));

describe('ProposalBoardScreen contextual integration', () => {
  it('inicia em Empresa e renderiza etapas para a primeira Empresa acessível', () => {
    const screen = render(<ProposalBoardScreen />);

    expect(screen.getByText('Mosaico')).toBeTruthy();
    expect(screen.getByText('Lead criado')).toBeTruthy();
    expect(screen.queryByText('Lista')).toBeNull();
    expect(screen.queryByText('Etapas')).toBeNull();
  });

  it('mantém controles de agrupamento e contexto fora dos filtros avançados', () => {
    const screen = render(<ProposalBoardScreen />);

    expect(screen.queryByText('Responsável')).toBeNull();
    expect(screen.queryByText('Programa')).toBeNull();
  });
});
