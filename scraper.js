//Credit to https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }

    return a;
}

// Credit to http://bgrins.github.io/devtools-snippets/#console-save (with modification)
console.save = function(data, ytLinks){

    if(!data) {
        console.error('Console.save: No data')
        return;
    }

    var dateNow = new Date();
    dateStr = dateNow.getFullYear()
      + "" + (dateNow.getMonth() < 10 ? '0' : '' ) + (dateNow.getMonth() + 1)
      + "" + (dateNow.getDate() < 10 ? '0' : '' ) + dateNow.getDate()
      + "_"+ (dateNow.getHours() < 10 ? '0' : '' ) + dateNow.getHours()
      + "" + (dateNow.getMinutes() < 10 ? '0' : '' ) + dateNow.getMinutes() ;

    filename = "ShazamSongsLinks_" + dateStr + '.txt'
    if(!ytLinks) {
      filename = 'ShazamSongsNames_' + dateStr + '.json'
    }

    if(typeof data === "object" && !ytLinks){
      data = JSON.stringify(data, undefined, 4)
    } else if(ytLinks){
      data = data.join("\n")
    }

    var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

    a.download = filename
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
    console.log(filename + " file has been downloaded!")
 }

function getYoutubeLink(urlComponent, savedSongsLength){
  var shazamVideoAPI = "https://www.shazam.com/video/v2/-/DE/-/track/-/videos?q=" + encodeURIComponent(urlComponent)
  var totalUrl = shazamVideoAPI
  //Credit to https://gist.github.com/joyrexus/7307312
  var httpRequest = new XMLHttpRequest()
  httpRequest.onreadystatechange = function (data) {
    if(httpRequest.readyState === 4 && httpRequest.status === 200) {
      videos = JSON.parse(httpRequest.responseText).youtube.videos;
      var views = 0
      var bestVideoId = 0

      if(videos.length > 0){
        videos.sort((a,b) => (a.views < b.views) ? 1 : ((b.views < a.views) ? -1 : 0));
        bestVideoId = videos[0].id
        videosHD = videos.filter(x => x.title.includes(" HD "))
        if(videosHD.length > 0){
          bestVideoId = videosHD[0].id
        }
        const ytURL = "https://www.youtube.com/watch?v="
        ytLink = ytURL + bestVideoId
        if(bestVideoId !== undefined){
          songLinkList.push(ytLink)
        } else {
          songLinkList.push("")
        }
      } else {
        songLinkList.push("")
      }


      if(songLinkList.length == savedSongsLength){
        console.save(songLinkList, true);
      }

      return true
    }
  }
  httpRequest.open('GET', totalUrl)
  httpRequest.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
  httpRequest.send()
}



function scrape() {
  const HEADER_FOOTER_ELEMENTS = 4
	document.getElementsByClassName('root')[0].scrollBy(0, 2000);
  const newSongs = Array.from(document.body.querySelectorAll('div.title')).map(x => {
    outText = ""
    if(x.lastElementChild != null) {
  	   outText = x.nextElementSibling.textContent.trim() + " - " + x.textContent.trim()
    }
    return outText;
  }).filter(x => x.length > 0)
  savedSongs.push.apply(savedSongs, newSongs)

  newSongListElementsCount = document.body.querySelectorAll('div.grid.grid-vert-center').length

  function lastTwoTraversalsIdentical(){
    l = songListElementsCount.length
    if(MIN_TRAVERSAL > 0 && songListElementsCount[l - 1] >= (MIN_TRAVERSAL + HEADER_FOOTER_ELEMENTS)){
        return true
    } else if(l > 3
      && songListElementsCount[l - 1] > numOfSongs
      && songListElementsCount[l - 1] == songListElementsCount[l - 2]
      && songListElementsCount[l - 2] == songListElementsCount[l - 3]
      && songListElementsCount[l - 3] == songListElementsCount[l - 4]) {
      return true
    } else {
      return false
    }
  }

	if(lastTwoTraversalsIdentical()){
		clearTimeout(scraperTimer);
    console.log("Finished scraping and now fetching youtube links (might take a minute)...")
		savedSongsUnique = arrayUnique(savedSongs)
		console.save(savedSongsUnique)
    savedSongsLength = savedSongsUnique.length
    savedSongsUnique.forEach(x=> {
      songComponents = x.split(" - ")
      songName = songComponents[songComponents.length - 1]
      artistName = songComponents[0].split(" Feat. ")[0]
      urlComponent = artistName + " \""+songName+"\""
      getYoutubeLink(urlComponent, savedSongsLength) //true if el last element
    })
    }

  songListElementsCount.push(newSongListElementsCount)
  console.log((new Date().getTime() -  initTime) / 1000 + "s - " + songListElementsCount[songListElementsCount.length - 1] + " songs scraped")
}


const MIN_TRAVERSAL = 0 // If you have less than 100 --> set this to your number of tracks; otherwise leave 0
const numOfSongs = parseInt(document.body.getElementsByClassName('count')[0].textContent)
const initTime = new Date().getTime()
savedSongs = []
songLinkList = []
songListElementsCount = []
scraperTimer = setInterval(scrape, 1000)
