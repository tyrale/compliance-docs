describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should register a new user successfully', () => {
    cy.visit('/register');
    
    // Fill in registration form
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, Test User');
  });

  it('should login successfully', () => {
    cy.visit('/login');
    
    // Fill in login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard');
  });

  it('should show validation errors for invalid login', () => {
    cy.visit('/login');
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Should show validation errors
    cy.contains('Email is required');
    cy.contains('Password is required');
  });

  it('should logout successfully', () => {
    // Login first
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Click logout button
    cy.get('[data-testid="logout-button"]').click();
    
    // Should redirect to login page
    cy.url().should('include', '/login');
  });
});
