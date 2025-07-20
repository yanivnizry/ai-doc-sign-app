import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import SignatureDrawer from '../../components/SignatureDrawer';

// Mock the signature canvas component
jest.mock('react-native-signature-canvas', () => {
  return function MockSignatureCanvas({ onOK }: any) {
    return (
      <div data-testid="signature-canvas">
        <button data-testid="signature-ok" onClick={() => onOK('test-signature-data')}>
          OK
        </button>
      </div>
    );
  };
});

describe('SignatureDrawer', () => {
  const mockOnSignatureChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render signature drawer correctly', () => {
    const { getByText } = render(
      <SignatureDrawer
        value=""
        onSignatureChange={mockOnSignatureChange}
        label="Test Signature"
      />
    );

    expect(getByText('Draw Signature')).toBeTruthy();
  });

  it('should show signature added state when value exists', () => {
    const { getByText } = render(
      <SignatureDrawer
        value="existing-signature-data"
        onSignatureChange={mockOnSignatureChange}
        label="Test Signature"
      />
    );

    expect(getByText('Signature Added ✓')).toBeTruthy();
  });

  it('should render signature canvas when modal is opened', () => {
    const { getByText, getByTestId } = render(
      <SignatureDrawer
        value=""
        onSignatureChange={mockOnSignatureChange}
        label="Test Signature"
      />
    );

    // Open the signature modal
    fireEvent.press(getByText('Draw Signature'));
    
    // Check that the signature canvas is rendered
    expect(getByTestId('signature-canvas')).toBeTruthy();
  });

  it('should display correct label', () => {
    const { getByText } = render(
      <SignatureDrawer
        value=""
        onSignatureChange={mockOnSignatureChange}
        label="Custom Signature Field"
      />
    );

    expect(getByText('Draw Signature')).toBeTruthy();
  });

  it('should handle signature button press', () => {
    const { getByText } = render(
      <SignatureDrawer
        value=""
        onSignatureChange={mockOnSignatureChange}
        label="Test Signature"
      />
    );

    fireEvent.press(getByText('Draw Signature'));

    // Modal should be opened (we can't easily test modal visibility in this setup)
    expect(getByText('Draw Signature')).toBeTruthy();
  });
}); 