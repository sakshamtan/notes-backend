// test/unit-tests.js
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Adjust the path accordingly

chai.use(chaiHttp);
const expect = chai.expect;

describe('Unit Tests', () => {
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
      // Assume you have a test user created for this test
      const res = await chai
        .request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('accessToken');
    });
  });

  // Note Endpoints
  describe('GET /api/notes', () => {
    it('should get a list of all notes for the authenticated user', async () => {
      // Assume you have a test user and some notes created for this test
      const res = await chai.request(app).get('/api/notes').set('Authorization', 'Bearer YOUR_ACCESS_TOKEN');

      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
    });
  });
});

