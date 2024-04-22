import express, { Router } from "express";
import serverless from "serverless-http";
import cors from "cors";
import axios from "axios";
import { Client } from "@notionhq/client";

const api = express();
const router = Router();

let bundle = [];
// TODO: CAHCE DOES NOT WORK SINCE IT IS SAVED PER ITEM, so there is no way of knowing if anything changed in the whole list beforehand
// let cache = { date: null, data: null };
let notion;

api.use(cors());

api.use("/api/", router);

router.get("/hello", (req, res) => res.send("Hello World!"));

router.get("/gamelist/:id", (req, res) => {
  notion = new Client({
    auth: "secret_bosJYRpBzDUNd9bfqiQ0yWJknYA66G5ebvUhqTiy9E2",
  });
  (async () => {
    const result = await getNotionData(
      req.params.id === "initial" ? undefined : req.params.id
    );

    const trimmedResult = [];
    result.results.forEach((gamedata) => {
      trimmedResult.push(getGameObject(gamedata));
    });
    res.json(trimmedResult);

    // const uniqueTrimmedResult = removeDuplicatesAndSort(trimmedResult, "id");

    // res.json(uniqueTrimmedResult);
  })();
});

router.get("/gamelist", (req, res) => {
  (async () => {
    notion = await new Client({
      auth: "secret_bosJYRpBzDUNd9bfqiQ0yWJknYA66G5ebvUhqTiy9E2",
    });
    await startNotionLooper(res);
  })();
});

// router.get("/artwork", (req, res) => {
//   const headers = {
//     "Client-ID": "m83mbo6r56trenidw05tz7rl0qake9",
//     Authorization: "Bearer mgqzu153x5jc9j006dnu8iv36532td",
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   };

//   axios
//     .post("https://api.igdb.com/v4/games", { fields: "*" }, { headers })
//     .then((response) => {
//       res.json(response);
//     })
//     .catch((err) => {
//       res.json(err);
//     });
// });

async function startNotionLooper(res, next_cursor = undefined) {
  let result = await getNotionData(next_cursor);

  // Just return cache if unchanged
  // if (result.last_edited_time === cache.date) {
  //   return res.json(cache.data);
  // }

  // on response, add result to bundle
  bundle = [...bundle, ...result.results];

  if (result.has_more) {
    // if this is not all, do it again using the new next_cursor
    next_cursor = result.next_cursor;
    console.log("retrying using ", next_cursor);
    await startNotionLooper(res, next_cursor);
  } else {
    const trimmedResult = [];

    bundle.forEach((gamedata) => {
      trimmedResult.push(getGameObject(gamedata));
    });

    const uniqueTrimmedResult = removeDuplicatesAndSort(trimmedResult, "id");

    bundle.splice(0, bundle.length);

    // cache.date = result.last_edited_time;
    // cache.data = uniqueTrimmedResult;

    // once done, return the bundle
    res.json(uniqueTrimmedResult);
  }
}

async function getNotionData(next_cursor) {
  const result = await notion.databases.query({
    database_id: "1f41efa65d6e47eebe88b6313a2f9889",
    start_cursor: next_cursor,
    sorts: [
      {
        property: "title",
        direction: "ascending",
      },
    ],
  });

  return result;
}

export const handler = serverless(api);

function removeDuplicatesAndSort(arr, prop) {
  const seen = new Map();
  arr.filter((item) => {
    const value = item[prop];
    if (!seen.has(value)) {
      seen.set(value, true);
      return true;
    }
    return false;
  });

  const groupedByStatus = arr.reduce((acc, obj) => {
    const { status } = obj;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(obj);
    return acc;
  }, {});

  for (const status in groupedByStatus) {
    if (groupedByStatus.hasOwnProperty(status)) {
      groupedByStatus[status].sort((a, b) => {
        // Sort by rating (high to low)
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // If rating is the same, sort by name (alphabetically)
        return a.name.localeCompare(b.name);
      });
    }
  }

  let result = [];

  if (groupedByStatus.playing) {
    result = [...result, ...groupedByStatus.playing];
  }

  if (groupedByStatus.replaying) {
    result = [...result, ...groupedByStatus.replaying];
  }

  if (groupedByStatus.queued) {
    result = [...result, ...groupedByStatus.queued];
  }

  if (groupedByStatus.finished) {
    result = [...result, ...groupedByStatus.finished];
  }

  return result;
}

function getGameObject(gamedata) {
  return {
    id: gamedata.id,
    status: gamedata.properties.status.select.name || "",
    rating: gamedata.properties.rating.select?.name || "",
    image: gamedata?.properties?.cover.files[0].name || "",
    name: gamedata?.properties?.title?.title[0].plain_text || "",
    platform: gamedata?.properties?.platform.multi_select[0].name || "",
    finished: gamedata?.properties["100%"].checkbox || false,
  };
}
