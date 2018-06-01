'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://username:password1@ds131119.mlab.com:31119/final_capstone_data';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'mongodb://localhost/test-stories-app';
exports.PORT = process.env.PORT || 3000;