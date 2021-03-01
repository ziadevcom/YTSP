let user = {};
let playlistName;
document.querySelector(".login").onclick = function () {
  const authOptions = {
    clientID: "d4530bfc63064a4493176570357abb89",
    redirectURI: window.location.origin,
    scopes: "user-read-private playlist-modify-public playlist-modify-private",
  };
  const requestURL = `https://accounts.spotify.com/authorize?response_type=token&client_id=${
    authOptions.clientID
  }&scope=${encodeURIComponent(
    authOptions.scopes
  )}&redirect_uri=${encodeURIComponent(authOptions.redirectURI)}`;
  window.location.href = requestURL;
};

window.onload = function () {
  let loginDIV = document.querySelector("#login");
  if (!document.location.hash) {
    loginDIV.classList.remove("hidden");
  } else {
    const hash = new URL(document.location.href).hash.substr(1);
    const paramsArr = hash.split("&");
    const params = {};
    paramsArr.forEach((param) => {
      let [x, y] = param.split("=");
      params[x] = y;
    });
    user.token = params.access_token;
    fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${params.access_token}`,
      },
    })
      .then((res) => res.json())
      .then((body) => setupUser(body))
      .catch((err) => {
        loginDIV.classList.remove("hidden");
        document.querySelector("#welcome").classList.add("hidden");
        throw Error(err);
      });
  }
};

function setupUser(userInfo) {
  user = { ...user, ...userInfo };
  let loginDIV = document.querySelector("#login");
  loginDIV.classList.add("hidden");
  let playlistDIV = document.querySelector("#playlist");
  playlistDIV.classList.remove("disabled");
  let welcomeDIV = document.querySelector("#welcome");
  welcomeDIV.classList.remove("hidden");
  welcomeDIV.children[0].src = user.images[0].url;
  welcomeDIV.children[1].innerHTML = `Welcome <span class='username'>${user.display_name}</span> , just FYI, this tool may not copy/duplicate all of the songs.
  Sometimes it does really well but sometimes "meh". Average is about
  85% successful duplications. Have Fun!`;
}

async function fetchPlaylist(btn) {
  let playlistDataDIV = document.querySelector("#playlistData");
  playlistDataDIV.innerHTML = "";
  let playlistID = btn.previousElementSibling.value;
  if (playlistID.length == 0) {
    btn.previousElementSibling.style.borderColor = "red";
    return notify("Playlist ID can't be empty.");
  }
  try {
    btn.parentElement.classList.add("disabled");
    btn.previousElementSibling.style.borderColor = "var(--primary)";
    let playlistID = btn.previousElementSibling.value;
    let response = await fetch(`http://localhost:3000/playlist/${playlistID}`);
    let playlist = await response.json();
    playlistName = playlist.playlistTitle;
    playlist.videos.forEach((video) => {
      let div = document.createElement("div");
      div.setAttribute("videoID", video.id);
      playlistDataDIV.appendChild(div);
      div.innerHTML = `
      <img class="thumbnail" src='${video.thumbnail}' />
      <h4>${video.title}</h4>
      <p>${video.channelName}</p>`;
    });
    addToSpotify();
    document.querySelector("#addToSpotify").classList.remove("disabled");
  } catch (error) {
    notify("Please make sure the ID is correct.");
  }
  btn.parentElement.classList.remove("disabled");
}

async function addToSpotify() {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  };
  let playList;
  createPlaylist();
  const trackIDs = document.querySelectorAll("[videoid]");

  try {
    trackIDs.forEach(async (videoID) => {
      let video = videoID.getAttribute("videoid");
      let response = await fetch(`http://localhost:3000/track/${video}`);
      let data = await response.json();
      const songTitle = data.songName;
      getSpotifyTrack(songTitle, videoID).then((trackToAdd) => {
        addTrackToPlaylist(playList, trackToAdd);
      });
    });
  } catch (error) {
    throw Error(error);
  }
  async function createPlaylist() {
    try {
      let postData = {
        name: playlistName,
        description: "Playlist created by xxx",
        public: true,
      };
      let createdPlaylist = await fetch(
        `https://api.spotify.com/v1/users/${user.id}/playlists`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(postData),
        }
      );
      let response = await createdPlaylist.json();
      console.log("Playlist created");
      playList = response.id;
    } catch (error) {
      throw Error(error);
    }
  }

  async function getSpotifyTrack(keyword, video) {
    try {
      let response = await fetch(
        `https://api.spotify.com/v1/search?q=${keyword}&type=track&limit=1`,
        { headers }
      );
      let track = await response.json();
      if (track.tracks.items.length == 0) {
        video.style.background = "rgb(221, 142, 142)";
        video.scrollIntoView();
        return "404";
      } else {
        video.style.background = "rgba(203, 243, 177, 0.801)";
        video.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
        return track.tracks.items[0].id;
      }
    } catch (error) {
      throw Error(error + " " + keyword);
    }
  }

  async function addTrackToPlaylist(playlistID, trackID) {
    try {
      if (trackID != "404") {
        let response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistID}/tracks?uris=spotify:track:${trackID}`,
          {
            method: "POST",
            headers,
          }
        );
        let trackStatus = await response.json();
      } else {
        throw new Error("Track Not Found");
      }
    } catch (error) {
      throw Error(error);
    }
  }
}

function notify(message) {
  let previousNote = document.querySelector(".notify");
  if (previousNote) {
    previousNote.remove();
  }
  let notification = document.createElement("div");
  notification.innerText = message;
  notification.innerHTML += `<span onclick='closeIcon(document.querySelector(".notify"), "remove")' class='closeIcon'>x</span>`;
  notification.classList.add("notify", "animated", "bounce");
  document.body.append(notification);
}
function closeIcon(el, func) {
  if (func === "hide") {
    el.style.display = "none";
  } else {
    el.remove();
  }
}
