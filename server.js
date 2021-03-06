'use strict';

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');

const { router: usersRouter } = require('./users');
const { router: authRouter, localStrategy, jwtStrategy } = require('./auth');

mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { Story } = require('./models');

const app = express();

app.use(morgan('common'));
app.use(bodyParser.json());
app.use(express.static('public'));

// CORS ?
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
      return res.send(204);
    }
    next();
});

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/users', usersRouter);
app.use('/auth', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/stories', jwtAuth, (req, res, next) => {
    Story.find()
        .then(stories => res.json(stories.map(story => story.serialize())))
        .catch(next);
});

app.get('/stories/story/:id', jwtAuth, (req, res, next) => {
    const id = req.params.id;
    Story.findById(id)
        .then(story => {
            if(story){
                res.status(201)
                .json(story.serialize())
            }else{
                next()
            }
        })
        .catch(next);
});

app.get('/stories/:user', jwtAuth, (req,res,next) =>{
    Story.find({user: req.params.user})
        .then(stories => res.json(stories.map(story => story.serialize())))
        .catch(next);
});

app.post('/stories', jwtAuth, (req, res, next) => {
    const { title, body, user } = req.body;
    if(!(title && body && user)){
        const err = new Error('Missing parameters in request body');
        err.status = 400;
        return next(err);
    }
    Story.create({title, body, user})
        .then(newStory => {
            res.status(201)
            .json(newStory.serialize())
        })
        .catch(next);
});

app.put('/stories/story/:id', jwtAuth, (req, res, next) => {
    const id = req.params.id;
    const updateItem = {};
    const updateFields = ['title', 'body', 'likes'];
    updateFields.forEach(field => {
        if(field in req.body){
            updateItem[field] = req.body[field]
        }
    })
    if(!updateItem){
        const err = new Error('Missing parameter in request body');
        err.status = 400;
        return next(err);
    }
    Story.findByIdAndUpdate(id, updateItem, {new: true})
        .then(story => {
            if(story){
                res.json(story.serialize())
            }else{
                next();
            }
        })
        .catch(next);
});

app.delete('/stories/story/:id', jwtAuth, (req, res, next) => {
    const id = req.params.id;
    Story.findByIdAndRemove(id)
        .then(count => {
            if(count){
                res.status(204).end();
            }else{
                next();
            }
        })
        .catch(next);
});

app.use('*', function(req, res){
    res.status(404).json({ message: 'Not found' });
});

let server;

function runServer(databaseUrl, port = PORT){
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
          if (err) {
            return reject(err);
          }
          server = app.listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
            .on('error', err => {
              mongoose.disconnect();
              reject(err);
            });
        });
      });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
};
  
module.exports = {app, runServer, closeServer};