const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs')

const app = express();
const port = 3000; // Choose the port your server will run on
const redirectUri = 'http://localhost:3000/oauth-callback'; // Replace with your actual redirect URI

const dotenv = require("dotenv").config();

//test if dotenv is working fine
console.log("this is client id :: " , process.CLIENT_ID)


const oauth2Client = new OAuth2Client({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});
app.get('/login', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // request a refresh token
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile', // scope for YouTube access, that is what all endpoints we will use
  });
  console.log("got the oauthurl")
  res.redirect(authUrl); // this redirects to REDIRECT_URL ?
});

app.get('/google/callback', async (req, res) => {
  
  const code = req.query.code;
  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    const channelName = await getChannelName(tokens.access_token);

    res.send(`Authentication successful. You can now use the tokens. Channel Name: ${channelName}
    <form action="/upload" method="POST" enctype="multipart/form-data">
        <label for="videoFile">Select a video file:</label>
        <input type="file" name="file">
        <input type="submit" value="Upload">
      </form>
    `);
    
  } catch (error) {
    res.send('Authentication failed. Please try again.');
    console.error('Error while exchanging the authorization code for tokens:', error);
  }
});

var Storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, "./videos");
  },
  filename: function(req, file, callback){
    callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
  },
});

var upload = multer({
  storage: Storage,
}).single("file");


app.post('/upload', async (req,res) => {
  
  // const { tokens } = await oauth2Client.getToken(code);
  
  upload(req,res,function(err){
    if(err){
      console.error('Error while exchanging the authorization code for tokens:', err);
    }
    console.log(req.file.path)
    title = 'video title'
    description = 'video'
    tags =  ['my-tag1', 'my-tag2']

    const youtube = google.youtube({
      version: 'v3',
      auth:oauth2Client
    })

    youtube.videos.insert(
    {
      resource:{
        snippet: {
                // categoryId: "22",
                title: 'My Video Title',
                description: 'My Video Description',
                tags: ['my-tag1', 'my-tag2'],
              },
        status: {
                privacyStatus: 'private',
              },
      },
      part:"snippet,status",
      media:{
        body:fs.createReadStream(req.file.path)
        }
    },

      (err,data) => {
        if(err){
          console.error(err);
          return res.status(500).send('Error uploading the file.');
        }
        console.log("upload complete")

        res.render("Success") //, {name,name,pic:pic,success:true})
      }
    )
    
  })
})

// Function to get the channel name using the access token
async function getChannelName(accessToken) {
  
   try {
      // Make an API request to the YouTube Data API to get the channel information
      oauth2Client.setCredentials({ access_token: accessToken });
      
      console.log("Now take the name")

      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet',
          mine: true,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

  
      // Extract the channel name from the API response
      const channelName = response.data.items[0].snippet.title;
      console.log("this is the response ", channelName)
      return channelName;
    } catch (error) {
      console.log(error)
      console.error('Error while getting channel name:', error);
      return 'Channel name not found';
    }

/*
  try {
    // const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const userInfo = await google.oauth2('v2').userinfo.get({ auth: oauth2Client });

    if (userInfo.data.email) {
      const channelInfo = await youtube.channels.list({
        auth: oauth2Client,
        part: 'snippet',
        mine: true,
        // forUsername: userInfo.data.email
      });

      return channelInfo.data.items[0].snippet.title;
    } else {
      throw new Error('No email information found.');
    }
  } catch (error) {
    console.error('Error while getting the channel name:', error);
    throw error;
  }
*/



  }

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


/*

 app.post('/upload', async (req, res) => {

// Ensure the request is authenticated and contains an access token
//   const accessToken = req.query.tokens.access_token;
//   if (!accessToken) {
//     res.status(401).send('Authentication is required to upload videos.');
//     return;
//   }

//   // Check if a video file is included in the request
//   if (!req.files || !req.files.videoFile) {
//     res.status(400).send('Please select a video file for upload.');
//     return;
//   }

//   // Upload the video to YouTube using the YouTube Data API
//   const videoFile = req.files.videoFile;
//   const videoMetadata = {
//     snippet: {
//       title: 'Your Video Title',
//       description: 'Your video description',
//       tags: ['tag1', 'tag2'],
//     },
//   };

  try {
    // Initialize the YouTube API client
    // const youtube = google.youtube({
    //   version: 'v3',
    //   auth: accessToken,
    // });

    // // Upload the video
    // const uploadResponse = await youtube.videos.insert({
    //   part: 'snippet,status',
    //   media: {
    //     mimeType: 'video/*',
    //     body: fs.createReadStream(videoFile.path),
    //   },
    //   resource: videoMetadata,
    // });

    console.log("\nRequest is :: \n");
    console.log(req); // returns empty array, => request nhi milra kuchh api ko => error at line 90.
    console.log("\nResponse is :: \n");
    console.log(res.data); // res.data is undefined//


    
    res.send('Video uploaded successfully! Video ID: ');// + uploadResponse.data.id);
  } catch (error) {
    console.error('Error while uploading video:', error);
    res.status(500).send('Video upload failed. Please try again.');
  }
});

*/