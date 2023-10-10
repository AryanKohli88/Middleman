// authURL -> has authorization code. ( for eg. htcallbacktp://localhost:3000/google/callback?code=4%2F0AfJohXnV5VGq3EytlM5-DG-OXFgFwibilUK5oFfHDkKPTjPxfKxJWlVmSJ-vvwR-eCnYcg&scope=profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.upload+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile)
// auth code is exchanged for access token and refresh token using oauth2client object.
// this access token will be used to make request to YT API.

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
// console.log("this is client id :: " , process.CLIENT_ID)

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

var code;
var save_tokens;

app.get('/google/callback', async (req, res) => {
  
  code = req.query.code;
  try {
    // Exchange the authorization code for tokens
    var { tokens } = await oauth2Client.getToken(code); // exchange auth code for access token
    save_tokens = tokens;

    const channelName = await getChannelName(tokens.access_token);
    // const __dirname = require('path').dirname(new URL(import.meta.url).pathname);

    res.sendFile(__dirname + '\\real\\youtuber.html');
    // res.send(`Authentication successful. You can now use the tokens. Channel Name: ${channelName}
    // <form action="/upload" method="POST" enctype="multipart/form-data">
    // <label for="editor"> Editor's email ID: </label>
    // <input type="text" placeholder="Enter text...">
    // <label for="videoFile">Select a video file:</label>
    // <input type="file" name="file">
    // <input type="submit" value="Upload">
    //   </form>
    // `);
    // res.redirect(youtuber.html)
    
    
  } catch (error) {
    res.send('Authentication failed. Please try again.');
    console.error('Error while exchanging the authorization code for tokens:', error);
  }
});

// Function to get the channel name using the access token
async function getChannelName(accessToken) {
  
   try {
      // Make an API request to the YouTube Data API to get the channel information
      // oauth2Client.setCredentials({ access_token: accessToken });

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

 }

 // Multer configuration
const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './videos'); // Adjust the destination folder
    console.log("done adjusting folder")
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '_' + Date.now() + '_' + file.originalname);
    console.log("Created a new file")
  },
});

const upload = multer({
  storage: Storage,
}).single('file');

app.post('/upload', async (req, res) => {

  const tokens = save_tokens;
  // const channelName = await getChannelName(tokens.access_token)

  upload(req, res, async function (err) {
    if (err) {
      console.error('Error while uploading the file:', err);
      res.status(500).send('Error uploading the file.');
    } else {
      console.log("itna to ho gaya")
      const accessToken = tokens.access_token; // Replace with the current access token
      const videoPath = req.file.path;
      const title = 'Your Video Title';
      const description = 'Your video description';
      const tags = ['tag1', 'tag2'];
      try {
        const videoData = await uploadVideo(accessToken, videoPath, title, description, tags);
        res.send('Video uploaded successfully! Video ID: ' + videoData.id);
      } catch (error) {
        res.status(500).send('Video upload failed. Please try again.');
      }
    }
  });
});

 async function uploadVideo(accessToken, videoPath, title, description, tags) {
  try {
    // Create a YouTube Data API client
    const youtube = google.youtube({
      version: 'v3',
      auth: accessToken,
      headers: {
        'authorization': 'Bearer ' + accessToken,
      },
    });

    // Define the video metadata
    const videoMetadata = {
      snippet: {
        title: title,
        description: description,
        tags: tags,
      },
      status: {
        privacyStatus: 'private', 
      },
    };

    // Upload the video
    const res = await youtube.videos.insert({
      part: 'snippet,status',
      media: {
        mimeType: 'video/*',
        body: fs.createReadStream(videoPath),
      },
      resource: videoMetadata,
    });

    return res.data;
  } catch (error) {
    console.error('Error while uploading video:', error);
    throw error;
  }
}


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
