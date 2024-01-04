// test/integration-tests.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Adjust the path accordingly

chai.use(chaiHttp);
const expect = chai.expect;

describe('Integration Tests', () => {
  let authToken; // To store the authentication token for later use

  // Authentication Endpoints
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/signup')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message').equal('User created successfully');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user and receive an access token', async () => {
      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('accessToken');
      authToken = res.body.accessToken; // Store the token for later use
    });
  });

  // Note Endpoints
  describe('GET /api/notes', () => {
    it('should get a list of all notes for the authenticated user', async () => {
      const res = await chai.request(app).get('/api/notes').set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note for the authenticated user', async () => {
      const res = await chai
        .request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Note', content: 'This is a test note' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message').equal('Note created successfully');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get a note by ID for the authenticated user', async () => {
      // Assume the noteId exists in your database
      const noteId = 'some_valid_note_id';
      const res = await chai.request(app).get(`/api/notes/${noteId}`).set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('title');
      expect(res.body).to.have.property('content');
    });

    it('should return 404 for a non-existent note', async () => {
      const nonExistentNoteId = 'non_existent_note_id';
      const res = await chai.request(app).get(`/api/notes/${nonExistentNoteId}`).set('Authorization', `Bearer ${authToken}`);

      expect(res).to.have.status(404);
    });
  });
});

