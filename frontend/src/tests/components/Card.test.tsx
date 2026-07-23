import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders CardHeader with title', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Content body</CardContent>
      </Card>
    );
    expect(screen.getByText('Content body')).toBeInTheDocument();
  });

  it('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer text</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer text')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Custom</Card>);
    expect(container.firstChild).toHaveClass('custom-card');
  });
});