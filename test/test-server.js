const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const { app, runServer, closeServer } = require('../server');
const { Story } = require('../models');
const {TEST_DATABASE_URL} = require('../config');

const expect = chai.expect;
chai.use(chaiHttp);

function generateStories(){
  return {
    title: faker.company.companyName(),
    body: faker.company.companyName(),
    likes: faker.random.number()
  };
};

function seedData(){
  console.info('seeding data');
  const seedData = [];
  for(let i=0; i<10; i++){
    seedData.push(generateStories());
  }
  return Story.insertMany(seedData);
}

function tearDownDb(){
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('API', function() {
  before(function(){
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function(){
    return seedData();
  });

  afterEach(function(){
    return tearDownDb();
  });

  after(function(){
    return closeServer();
  });

  describe('Get endpoint', function(){
    it('should return all existing stories', function(){
      let res;
      return chai.request(app)
        .get('/stories')
        .then(function(_res){
          res = _res;
          //expect(res).to.have.have.status(200);
          expect(res.body.foods).to.have.lengthOf.at.least(1);
          return Story.count(1);
        })
        .then(function(count){
          expect(res.body.stories).to.have.lengthOf(count);
        });
    });
  })
});