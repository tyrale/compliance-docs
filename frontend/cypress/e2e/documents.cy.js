describe('Document Management Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
  });

  it('should upload a document successfully', () => {
    cy.visit('/documents');
    
    // Click upload button
    cy.get('[data-testid="upload-button"]').click();
    
    // Upload file
    cy.get('input[type="file"]').attachFile('test-document.pdf');
    cy.get('input[name="title"]').type('Test Document');
    
    // Submit upload
    cy.get('button[type="submit"]').click();
    
    // Should show success message
    cy.contains('Document uploaded successfully');
    
    // Should show uploaded document in list
    cy.contains('Test Document');
  });

  it('should view document details', () => {
    cy.visit('/documents');
    
    // Click on document
    cy.contains('Test Document').click();
    
    // Should show document details
    cy.url().should('include', '/documents/');
    cy.contains('Test Document');
    cy.contains('Sections');
    cy.contains('Annotations');
  });

  it('should add annotation to document', () => {
    cy.visit('/documents');
    cy.contains('Test Document').click();
    
    // Select text and add annotation
    cy.get('[data-testid="document-content"]')
      .trigger('mousedown')
      .trigger('mousemove', { clientX: 200, clientY: 200 })
      .trigger('mouseup');
    
    cy.get('[data-testid="add-annotation-button"]').click();
    cy.get('textarea[name="annotation"]').type('Test annotation');
    cy.get('button').contains('Save').click();
    
    // Should show annotation
    cy.contains('Test annotation');
  });

  it('should delete document', () => {
    cy.visit('/documents');
    
    // Click delete button
    cy.contains('Test Document')
      .parent()
      .find('[data-testid="delete-button"]')
      .click();
    
    // Confirm deletion
    cy.get('[data-testid="confirm-delete"]').click();
    
    // Should show success message
    cy.contains('Document deleted successfully');
    
    // Document should not be in list
    cy.contains('Test Document').should('not.exist');
  });
});
