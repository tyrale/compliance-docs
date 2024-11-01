// Import cypress file upload package
import 'cypress-file-upload';

// Custom command for login
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Custom command for API login (faster than UI login)
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
  });
});

// Custom command for file upload
Cypress.Commands.add('uploadFile', (fileName, fileType = '', selector = 'input[type="file"]') => {
  cy.get(selector).attachFile(fileName);
});
