import express from "express";
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

require("dotenv").config();

const app = express();

const urls = {
  daum: {
    current: "https://movie.daum.net/api/premovie?page=1&size=20&flag=Y",
    premovie: "https://movie.daum.net/api/premovie?page=1&size=20&flag=C",
  },
  naver: {
    current: "https://movie.naver.com/movie/running/current.nhn",
    premovie: "https://movie.naver.com/movie/running/premovie.nhn",
  },
  cgv: {
    current: "http://www.cgv.co.kr/movies/",
    premovie: "http://www.cgv.co.kr/movies/pre-movies.aspx",
  },
};

interface DaumMovie {
  titleKorean: string;
  countryMovieInformation: {
    duration: number;
    releaseDate: string;
  };
}

interface Movie {
  name: string;
  runningTime: number | null;
  openDate: Date;
}

interface Movies {
  naverMovie: Movie[];
  daumMovie: Movie[];
  cgvMovie: Movie[];
}

app.get("/movies", async (req, res) => {
  const start = new Date();

  const instance = axios.create({
    timeout: 5000,
  });

  const movies: Movies = {
    naverMovie: [],
    daumMovie: [],
    cgvMovie: [],
  };

  // NAVER
  // current
  const naverCurrentResponse = await instance.get(urls.naver.current);

  let $ = cheerio.load(naverCurrentResponse.data);
  const naverCurrentMovieList = $("ul.lst_detail_t1 li");

  naverCurrentMovieList.each((_, movie) => {
    const data = $(movie).find("dl dd dl.info_txt1 dd:eq(0)").text();

    // name
    const name = $(movie).find("dl dt a").text();

    // runningTime
    const findIndexRunningTime = data.indexOf("분");
    const runningTime = data
      .slice(findIndexRunningTime - 5, findIndexRunningTime)
      .trim();

    // openDate
    const findIndexOpenDate = data.indexOf("개봉");
    const beforeOpenDate = data
      .slice(findIndexOpenDate - 12, findIndexOpenDate)
      .trim();
    const openDate = new Date(beforeOpenDate);

    const newMovie: Movie = {
      name,
      runningTime: Number(runningTime),
      openDate: new Date(openDate.setHours(openDate.getHours() + 9)),
    };

    movies.naverMovie.push(newMovie);
  });

  // premovie
  const naverPremovieResponse = await instance.get(urls.naver.premovie);

  $ = cheerio.load(naverPremovieResponse.data);
  const naverPreMovieList = $("ul.lst_detail_t1 li");

  naverPreMovieList.each((_, movie) => {
    const data = $(movie).find("dl dd dl.info_txt1 dd:eq(0)").text();

    // name
    const name = $(movie).find("dl dt a").text();
    // runningTime
    const findIndexRunningTime = data.indexOf("분");
    const runningTime = data
      .slice(findIndexRunningTime - 5, findIndexRunningTime)
      .trim();

    // openDate
    const findIndexOpenDate = data.indexOf("개봉");
    const beforeOpenDate = data
      .slice(findIndexOpenDate - 12, findIndexOpenDate)
      .trim();
    const openDate = new Date(beforeOpenDate);
    const newMovie: Movie = {
      name,
      runningTime: Number(runningTime),
      openDate: new Date(openDate.setHours(openDate.getHours() + 9)),
    };

    movies.naverMovie.push(newMovie);
  });

  // CGV
  // current
  const cgvCurrentResponse = await instance.get(urls.cgv.current);

  $ = cheerio.load(cgvCurrentResponse.data);

  const cgvCurrentMovieList = $(
    "div.sect-movie-chart > ol > li > div.box-contents"
  );

  cgvCurrentMovieList.each((_, movie) => {
    // name
    const name = $(movie).find("a strong").text().trim();

    // openDate
    const data = $(movie).find("span.txt-info > strong").text();
    const findIndexOpenDate = data.indexOf("개봉");
    const beforeOpenDate = data.slice(0, findIndexOpenDate).trim();
    const openDate = new Date(beforeOpenDate);
    // runningTime
    const newMovie: Movie = {
      name,
      runningTime: null,
      openDate: new Date(openDate.setHours(openDate.getHours() + 9)),
    };

    movies.cgvMovie.push(newMovie);
  });

  // premovie
  const cgvPremovieResponse = await instance.get(urls.cgv.premovie);

  $ = cheerio.load(cgvPremovieResponse.data);
  const cgvPreMovieList = $(
    "div.sect-movie-chart > ol > li > div.box-contents"
  );

  cgvPreMovieList.each((_, movie) => {
    // name
    const name = $(movie).find("a strong").text().trim();
    // openDate
    const data = $(movie).find("span.txt-info > strong").text().trim();
    let findIndexOpenDate = data.indexOf("개봉");
    if (findIndexOpenDate === -1) {
      findIndexOpenDate = data.indexOf("개봉예정");
    }
    const beforeOpenDate = data.slice(0, findIndexOpenDate).trim();
    const openDate = new Date(beforeOpenDate);

    // runningTime

    const newMovie: Movie = {
      name,
      runningTime: null,
      openDate: new Date(openDate.setHours(openDate.getHours() + 9)),
    };

    movies.cgvMovie.push(newMovie);
  });

  // DAUM
  // current
  const daumCurrentResponse = await instance.get<{ contents: any[] }>(
    urls.daum.current
  );
  daumCurrentResponse.data.contents.forEach((movie) => {
    const name = movie.titleKorean;
    const runningTime = movie.countryMovieInformation.duration;
    const openDateData = movie.countryMovieInformation.releaseDate;
    const openDate = new Date(
      `${openDateData.slice(0, 4)}.${openDateData.slice(
        4,
        6
      )}.${openDateData.slice(6, 8)}`
    );
    const newMovie: Movie = {
      name,
      runningTime,
      openDate: new Date(openDate.setHours(openDate.getHours() + 9)),
    };
    movies.daumMovie.push(newMovie);
  });

  // pre
  const daumPremovieResponse = await instance.get<{ contents: DaumMovie[] }>(
    urls.daum.premovie
  );
  daumPremovieResponse.data.contents.forEach((movie) => {
    const name = movie.titleKorean;
    const runningTime = movie.countryMovieInformation.duration;
    const openDateData = movie.countryMovieInformation.releaseDate;
    const openDate = new Date(
      `${openDateData.slice(0, 4)}.${openDateData.slice(
        4,
        6
      )}.${openDateData.slice(6, 8)}`
    );
    const newMovie: Movie = {
      name,
      runningTime,
      openDate: new Date(openDate.setHours(openDate.getHours() + 9)),
    };
    movies.daumMovie.push(newMovie);
  });

  // log
  const end = new Date();
  const boforeLog = fs.readFileSync("logs/log", "utf8");
  const count =
    movies.cgvMovie.length + movies.naverMovie.length + movies.daumMovie.length;
  fs.writeFileSync(
    "logs/log",
    (boforeLog
      ? boforeLog + "start: " + start + ", end: " + end
      : "start: " + start + ", end: " + end) +
      ", count: " +
      count +
      "\n"
  );

  // res.send("<h1>helloworld !</h1>");
  return res.status(200).json({ movies });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`PORT Listen At ${PORT}`);
});

export default app;
