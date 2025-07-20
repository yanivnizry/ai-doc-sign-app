// Mock expo modules
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn().mockResolvedValue('Test PDF content'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  documentDirectory: '/mock/document/directory/',
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock React Native components
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Modal: 'Modal',
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  Alert: {
    alert: jest.fn(),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({
    error: 'Test error message',
    onRetry: 'true',
  }),
}));

// Mock expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  AntDesign: 'AntDesign',
}));

// Mock environment variables
process.env.EXPO_PUBLIC_LOCAL_LLM_URL = 'http://localhost:11434';
process.env.EXPO_PUBLIC_LOCAL_LLM_MODEL = 'llama2';
process.env.EXPO_PUBLIC_LOCAL_LLM_MAX_TOKENS = '3000';
process.env.EXPO_PUBLIC_BACKEND_API_URL = 'http://localhost:3000'; 