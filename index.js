'use strict'

require('dotenv').config();

const gcloud = require('google-cloud');
const admin = require('firebase-admin');
const fs = require('fs');

const Raspistill = require('node-raspistill').Raspistill;
const camera = new Raspistill({
    verticalFlip: true,
    width: 800,
    height: 600
});

const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

camera.takePhoto().then((photo) => {
  let filename = 'finland-shot-' + Date.now() + '.jpg';

  const storage = gcloud.storage({
      projectId: process.env.PROJECT_ID,
      keyFilename: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
  });

  const bucket = storage.bucket(process.env.GOOGLE_STORAGE_BUCKET);

  // until we know how to upload a buffer directly to google cloud, we'll just write it to disk
  // upload it, and then delete the temporary file afterwards.
  fs.writeFile('temp.jpg', photo, 'binary', (err) => {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }

    bucket.upload('temp.jpg', { destination : filename }).then((file) => {
      fs.unlink('temp.jpg',(err) => {
          if(err) return console.log(err);
          console.log('temporary file deleted successfully');
        });
      });
  }).catch((reason) => {
    console.log(reason);
  });
});