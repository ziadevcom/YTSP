const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fetch = require("node-fetch");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const api = process.env.YOUTUBE_API_KEY;

app.get("/track/:trackID", async function (req, res) {
  const trackID = req.params.trackID;
  try {
    let response = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&id=${trackID}&key=${api}`
    );
    let video = await response.json();
    let songName = video.items[0].snippet.title
      .replace(
        /\([\s\S]*?\)|\[[\s\S]*?\]|\lyrics|\lyric|\Video|\Official|\x |\- /gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();
    res.json({ songName });
  } catch (error) {
    res.json({ error });
  }
  // const browser = await puppeteer.launch({ headless: true });
  // try {
  //   const url = `https://www.youtube.com/watch?v=${trackID}`;
  //   const page = await browser.newPage();
  //   await page.goto(url);
  //   await page.click("#meta-contents #more");

  //   let songName = await page.evaluate(function () {
  //     const songMeta = {};
  //     let keys = document.querySelectorAll(
  //       "ytd-metadata-row-container-renderer #collapsible ytd-metadata-row-renderer #title yt-formatted-string"
  //     );
  //     if (keys.length >= 1) {
  //       let values = document.querySelectorAll(
  //         "ytd-metadata-row-container-renderer #collapsible ytd-metadata-row-renderer #content yt-formatted-string"
  //       );
  //       keys.forEach(function (key, index) {
  //         songMeta[key.innerText.toLowerCase()] = values[index].innerText;
  //       });
  //       return songMeta.song;
  //     } else {
  //       return document
  //         .querySelector("h1.title")
  //         .innerText.replace(
  //           /\([\s\S]*?\)|\[[\s\S]*?\]|\lyrics|\lyric|\Video|\Official/gi,
  //           ""
  //         )
  //         .replace(/\s+/g, " ")
  //         .trim();
  //     }
  //   });
  //   res.json({ songName });
  // } catch (error) {
  //   res.json({ error });
  // } finally {
  //   await browser.close();
  // }
});

app.get("/playlist/:playlistID", async function (req, res) {
  try {
    let playlistResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlists?part=snippet&id=${req.params.playlistID}&key=${api}`
    );
    let playlistData = await playlistResponse.json();
    let title = playlistData.items[0].snippet.localized.title;
    let videosResponse = await fetch(
      `https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${req.params.playlistID}&key=${api}`
    );
    let playlistVideos = await videosResponse.json();
    if (playlistVideos.error) {
      res
        .json({ error: "Please provide a valid playlist ID." })
        .sendStatus(404);
    } else {
      let formattedData = playlistVideos.items.map((video) => {
        let snippet = video.snippet;
        let obj = {};
        obj.id = snippet.resourceId.videoId;
        obj.title = snippet.title;
        obj.thumbnail = snippet.thumbnails.high.url;
        obj.href = `https://www.youtube.com/watch?v=${obj.id}`;
        obj.channelName = snippet.videoOwnerChannelTitle;
        return obj;
      });
      res.json({ playlistTitle: title, videos: formattedData });
    }
  } catch (error) {
    res.json({ error });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("*", function (req, res) {
  res.status(404).redirect("http://localhost:3000");
});
app.listen(3000, () => {
  console.log("http://localhost:3000");
});
