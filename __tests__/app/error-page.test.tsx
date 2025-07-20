import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import ErrorPage from '../../app/error-page';

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

describe('ErrorPage', () => {
  it('should render error page with error message', () => {
    const { getByText } = render(<ErrorPage />);

    expect(getByText('Something Went Wrong')).toBeTruthy();
    expect(getByText('Test error message')).toBeTruthy();
  });

  it('should render retry and back buttons', () => {
    const { getByText } = render(<ErrorPage />);

    expect(getByText('Try Again')).toBeTruthy();
    expect(getByText('Go Back')).toBeTruthy();
  });

  it('should display error details section', () => {
    const { getByText } = render(<ErrorPage />);

    expect(getByText('Error Details:')).toBeTruthy();
    expect(getByText('Test error message')).toBeTruthy();
  });

  it('should display help section', () => {
    const { getByText } = render(<ErrorPage />);

    expect(getByText('Need Help?')).toBeTruthy();
    expect(getByText('If you continue to experience issues, please contact our support team.')).toBeTruthy();
  });

  it('should handle different error types', () => {
    const { getByText, rerender } = render(<ErrorPage />);

    // Test timeout error
    jest.doMock('expo-router', () => ({
      useRouter: () => ({
        push: jest.fn(),
        canGoBack: () => true,
      }),
      useLocalSearchParams: () => ({
        error: 'Backend request timeout',
        onRetry: 'true',
      }),
    }));

    rerender(<ErrorPage />);
    expect(getByText('Connection Timeout')).toBeTruthy();
  });

  it('should handle network errors', () => {
    const { getByText, rerender } = render(<ErrorPage />);

    // Test network error
    jest.doMock('expo-router', () => ({
      useRouter: () => ({
        push: jest.fn(),
        canGoBack: () => true,
      }),
      useLocalSearchParams: () => ({
        error: 'Network request failed',
        onRetry: 'true',
      }),
    }));

    rerender(<ErrorPage />);
    expect(getByText('Network Error')).toBeTruthy();
  });

  it('should handle backend processing errors', () => {
    const { getByText, rerender } = render(<ErrorPage />);

    // Test backend error
    jest.doMock('expo-router', () => ({
      useRouter: () => ({
        push: jest.fn(),
        canGoBack: () => true,
      }),
      useLocalSearchParams: () => ({
        error: 'Backend processing failed',
        onRetry: 'true',
      }),
    }));

    rerender(<ErrorPage />);
    expect(getByText('Processing Error')).toBeTruthy();
  });

  it('should handle button interactions', () => {
    const mockPush = jest.fn();
    jest.doMock('expo-router', () => ({
      useRouter: () => ({
        push: mockPush,
        canGoBack: () => true,
      }),
      useLocalSearchParams: () => ({
        error: 'Test error',
        onRetry: 'true',
      }),
    }));

    const { getByText } = render(<ErrorPage />);

    fireEvent.press(getByText('Try Again'));
    expect(mockPush).toHaveBeenCalled();

    fireEvent.press(getByText('Go Back'));
    expect(mockPush).toHaveBeenCalled();
  });

  it('should handle missing error parameter', () => {
    jest.doMock('expo-router', () => ({
      useRouter: () => ({
        push: jest.fn(),
        canGoBack: () => true,
      }),
      useLocalSearchParams: () => ({
        onRetry: 'true',
      }),
    }));

    const { getByText } = render(<ErrorPage />);

    expect(getByText('An unknown error occurred')).toBeTruthy();
  });
}); 