import express, { Router } from "express";
import serverless from "serverless-http";
import cors from "cors";
import { Client } from "@notionhq/client";

const api = express();
const router = Router();

let bundle = [];
let notion;

api.use(cors());

api.use("/api/", router);

router.get("/hello", (req, res) => res.send("Hello World!"));

router.get("/gamelist", (req, res) => {
  // reset bundle to fix cache
  notion = new Client({
    auth: "secret_bosJYRpBzDUNd9bfqiQ0yWJknYA66G5ebvUhqTiy9E2",
  });
  (async () => {
    await startNotionLooper(res);
  })();
});

async function startNotionLooper(res, next_cursor = undefined) {
  let result = await getNotionData(next_cursor);

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
      trimmedResult.push({
        id: gamedata.id,
        status: gamedata.properties.status.select.name || "",
        rating: gamedata.properties.rating.select?.name || "",
        image: gamedata?.properties?.cover.files[0].name || "",
        name: gamedata?.properties?.title?.title[0].plain_text || "",
        platform: gamedata?.properties?.platform.multi_select[0].name || "",
        "100%": gamedata?.properties["100%"].checkbox || false,
      });
    });

    const uniqueTrimmedResult = removeDuplicatesAndSort(trimmedResult, "id");

    bundle.splice(0, bundle.length);

    // once done, return the bundle
    res.json(uniqueTrimmedResult);
  }
}

async function getNotionData(next_cursor) {
  const result = await notion.databases.query({
    database_id: "1f41efa65d6e47eebe88b6313a2f9889",
    start_cursor: next_cursor,
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

  return [
    ...groupedByStatus.playing,
    ...groupedByStatus.replaying,
    ...groupedByStatus.queued,
    ...groupedByStatus.completed,
  ];
}

function sortByName(arr) {
  // Use the sort method with a compare function
  arr.sort((a, b) => {
    // Convert names to lowercase for case-insensitive sorting
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    // Compare the names
    if (nameA < nameB) return -1; // nameA comes before nameB
    if (nameA > nameB) return 1; // nameA comes after nameB
    return 0; // names are equal
  });
}

function filterByStatus(arr, status) {
  return arr.filter((obj) => obj.status === status);
}
