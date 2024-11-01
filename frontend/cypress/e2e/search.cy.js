describe('Search Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
  });

  it('should perform basic search', () => {
    cy.visit('/search');
    
    // Enter search term
    cy.get('[data-testid="search-input"]').type('compliance');
    cy.get('[data-testid="search-button"]').click();
    
    // Should show search results
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.contains('Search Results');
    cy.get('[data-testid="result-item"]').should('have.length.at.least', 1);
  });

  it('should use advanced search operators', () => {
    cy.visit('/search');
    
    // Use AND operator
    cy.get('[data-testid="search-input"]').type('compliance AND security');
    cy.get('[data-testid="search-button"]').click();
    
    // Should show filtered results
    cy.get('[data-testid="search-results"]').should('be.visible');
    cy.get('[data-testid="result-item"]').each(($el) => {
      cy.wrap($el).should(($item) => {
        expect($item.text().toLowerCase()).to.match(/compliance.*security|security.*compliance/);
      });
    });
  });

  it('should filter search by section', () => {
    cy.visit('/search');
    
    // Use section filter
    cy.get('[data-testid="section-filter"]').click();
    cy.get('[data-testid="section-option"]').contains('Introduction').click();
    cy.get('[data-testid="search-input"]').type('overview');
    cy.get('[data-testid="search-button"]').click();
    
    // Should show section-specific results
    cy.get('[data-testid="result-item"]').each(($el) => {
      cy.wrap($el).should('contain', 'Introduction');
    });
  });

  it('should save search history', () => {
    cy.visit('/search');
    
    // Perform search
    cy.get('[data-testid="search-input"]').type('compliance policy');
    cy.get('[data-testid="search-button"]').click();
    
    // Check search history
    cy.get('[data-testid="search-history"]').click();
    cy.contains('compliance policy');
    
    // Click history item
    cy.get('[data-testid="history-item"]').first().click();
    
    // Should populate search input
    cy.get('[data-testid="search-input"]').should('have.value', 'compliance policy');
  });

  it('should show no results message', () => {
    cy.visit('/search');
    
    // Search for non-existent term
    cy.get('[data-testid="search-input"]').type('xyznonexistent123');
    cy.get('[data-testid="search-button"]').click();
    
    // Should show no results message
    cy.contains('No results found');
    cy.get('[data-testid="result-item"]').should('not.exist');
  });
});
