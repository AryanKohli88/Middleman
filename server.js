const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const multer = require('multer');

const app = express();
const port = 3000; // Choose the port your server will run on
const redirectUri = 'http://localhost:3000/oauth-callback'; // Replace with your actual redirect URI

const dotenv = require("dotenv").config();

// Configure the OAuth client
// oauth object banaliya idhar
const oauth2Client = new OAuth2Client({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});
// console.log("CLIENT_ID is :: ", process.env.CLIENT_ID)
// Generate the URL for user sign-in
// ab ye object use karna ha agar authorisation ke liye toh user ko token chahiye,
// access_type tells ki kis type ka access token chahiyeand scope tells kdhar ke access ke liye token chshiye
app.get('/login', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // request a refresh token
    scope: 'https://www.googleapis.com/auth/youtube', // scope for YouTube access
  });

  res.redirect(authUrl);
});

// Handle the redirect URL
// abhi agar authenticate ho gaya toh token dekar access lele

  app.get('/oauth-callback', async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens securely
    // Use tokens.access_token for making authorized API requests
    // Use tokens.refresh_token to obtain a new access token when needed
    const channelName = await getChannelName(tokens.access_token);

    res.send(`Authentication successful. You can now use the tokens. Channel Name: ${channelName}
    <form action="/upload" method="post" enctype="multipart/form-data">
        <label for="videoFile">Select a video file:</label>
        <input type="file" name="video">
        <input type="submit" value="Upload">
      </form>
    `);
    
  } catch (error) {
    res.send('Authentication failed. Please try again.');
    console.error('Error while exchanging the authorization code for tokens:', error);
  }
});


// Create a Multer middleware to handle file uploads.
const upload = multer({ dest: './uploads' });


app.post('/upload', upload.single('video'), async (req, res) => {
  // Get the video file from the request.
  const videoFile = req.file;

  // Create a new YouTube video resource.
  const video = {
    snippet: {
      title: 'My Video Title',
      description: 'My Video Description',
      tags: ['my-tag1', 'my-tag2'],
    },
    status: {
      privacyStatus: 'private',
    },
  };

  // Set the video file part.
  video.fileDetails = {
    videoFile,
  };

  // Upload the video to YouTube.
  const youtube = require('youtube-api');
  const OAuth2 = google.auth.OAuth2;

  // Create an OAuth2 client.
  const client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  const token = await client.getAccessToken();

  // Create a YouTube API service.
  const service = new youtube.YouTube({
    auth: client,
  });

  // Upload the video.
  const response = await service.videos.insert({
    part: 'snippet,status,fileDetails',
    resource: video,
    auth,
  });

  // Get the video ID.
  const videoId = response.data.id;

  // Send the video ID back to the client.
  res.send({ videoId });
});

// // Create a route to render the upload form.
// app.get('/', (req, res) => {
//   res.sendFile('upload.html');
// });


// Function to get the channel name using the access token
async function getChannelName(accessToken) {
    try {
      // Make an API request to the YouTube Data API to get the channel information
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
      return channelName;
    } catch (error) {
      console.error('Error while getting channel name:', error);
      return 'Channel name not found';
    }
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