import express, { Router } from "express";
import serverless from "serverless-http";
import cors from "cors";
import axios from "axios";
import { Client } from "@notionhq/client";

const api = express();
const router = Router();

let run;
let bundle = [];
let cache = { date: null, data: null };
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
    run = 1;
    await startNotionLooper(res, undefined, run);
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

async function startNotionLooper(res, next_cursor = undefined, run = 1) {
  let result = await getNotionData(next_cursor);

  if (run === 1) {
    if (result.results[0].last_edited_time === cache.date) {
      // nothing changed, return cache
      console.log("cache hit");
      return res.json(cache.data);
    } else {
      // set cache date and keep going
      cache.date = result.results[0].last_edited_time;
    }
  }

  // on response, add result to bundle
  bundle = [...bundle, ...result.results];

  if (result.has_more) {
    // if this is not all, do it again using the new next_cursor
    next_cursor = result.next_cursor;
    console.log("requesting new data using", next_cursor);
    run = run + 1;
    await startNotionLooper(res, next_cursor, run);
  } else {
    const trimmedResult = [];

    bundle.forEach((gamedata) => {
      trimmedResult.push(getGameObject(gamedata));
    });

    const uniqueTrimmedResult = removeDuplicatesAndSort(trimmedResult, "id");

    bundle.splice(0, bundle.length);

    // set final as cache
    cache.data = uniqueTrimmedResult;

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
        timestamp: "last_edited_time",
        direction: "descending",
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
    status: gamedata.properties?.status.select.name || "",
    rating: gamedata.properties?.rating.select?.name || "",
    image: gamedata.properties?.cover.files[0].name || "",
    name: gamedata.properties?.title?.title[0].plain_text || "",
    platform: gamedata.properties?.platform.multi_select[0].name || "",
    completed: gamedata.properties?.completed.checkbox || false,
  };
}

/**
 * LL STUFF
 */

//get data based on userid
router.get("/ll/:userid", (req, res) => {
  notion = new Client({
    auth: "secret_3Chdy721CTWbWAqsfwox0pCiVedTyLVXIIl58D7joY3",
  });
  (async () => {
    const data = await getNotionLLData();
    const trimmedResult = [];
    const userId = req.params.userid;
    data.results.forEach((entry) => {
      if (
        entry.properties.userid.rich_text[0].plain_text === userId ||
        userId === "all"
      ) {
        trimmedResult.push(getLLBuild(entry));
      }
    });
    res.json(trimmedResult);
  })();
});

//add / update
router.post("/ll/add/", (req, res) => {
  notion = new Client({
    auth: "secret_3Chdy721CTWbWAqsfwox0pCiVedTyLVXIIl58D7joY3",
  });

  const requestBody = JSON.parse(req.body);
  console.log(requestBody);

  (async () => {
    const data = await getNotionLLData();
    const userIdToLookFor = requestBody.userid;
    const nameToLookFor = requestBody.name;
    let foundId = null;
    data.results.forEach((page) => {
      console.log(page.properties);
      if (
        page.properties.userid.rich_text[0].plain_text === userIdToLookFor &&
        page.properties.name.title[0].plain_text === nameToLookFor
      ) {
        foundId = page.id;
      }
    });
    if (foundId) {
      console.log(
        nameToLookFor,
        "is found in NOTION! please update using:",
        foundId
      );
      const response = await notion.pages.update({
        page_id: foundId,
        properties: getPropertiesObject(requestBody),
      });
    } else {
      console.log(nameToLookFor, "is not found in NOTION!");
      const response = await notion.pages.create({
        parent: {
          type: "database_id",
          database_id: "1166b583229a80f4a431e9b43908ff61",
        },
        properties: getPropertiesObject(requestBody),
      });
    }
  })();
  res.send({
    message: "New user was added to the list",
  });
});

// delete
router.post("/ll/delete/", (req, res) => {
  notion = new Client({
    auth: "secret_3Chdy721CTWbWAqsfwox0pCiVedTyLVXIIl58D7joY3",
  });

  const requestBody = JSON.parse(req.body);
  console.log(requestBody);

  (async () => {
    const data = await getNotionLLData();
    const userIdToLookFor = requestBody.userid;
    const nameToLookFor = requestBody.name;
    let foundId = null;
    data.results.forEach((page) => {
      if (
        page.properties.userid.rich_text[0].plain_text === userIdToLookFor &&
        page.properties.name.title[0].plain_text === nameToLookFor
      ) {
        foundId = page.id;
      }
    });
    if (foundId) {
      console.log(nameToLookFor, "is found in NOTION! will delete!", foundId);
      const response = await notion.pages.update({
        page_id: foundId,
        in_trash: true,
        archived: true,
      });
    } else {
      console.log(nameToLookFor, "was not found, nothing to delete!");
    }
  })();
  res.send({
    message: "User was deleted from the list",
  });
});

async function getNotionLLData() {
  const result = await notion.databases.query({
    database_id: "1166b583229a80f4a431e9b43908ff61",
    sorts: [],
  });

  return result;
}

function getLLBuild(build) {
  return {
    id: build.id,
    name: build.properties?.name.title[0].plain_text || "",
    hp: build.properties?.hp.number || 0,
    level: build.properties?.level.number || 0,
    core: build.properties?.core.rich_text[0].plain_text || "",
    class: build.properties?.class.rich_text[0].plain_text || "",
    skill: build.properties?.skill.rich_text[0].plain_text || "",
    ability: build.properties?.ability.rich_text[0].plain_text || "",
    element: build.properties?.element.rich_text[0].plain_text || "",
    equipment: build.properties?.equipment.rich_text[0].plain_text || "",
    filter: build.properties?.filter.rich_text[0].plain_text || "",
    cooldown: build.properties?.cooldown.rich_text[0].plain_text || "",
  };
}

function getPropertiesObject(data) {
  return {
    userid: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.userid, link: null },
        },
      ],
    },
    name: {
      title: [
        {
          text: {
            content: data.name,
          },
        },
      ],
    },
    hp: {
      number: data.hp,
    },
    race: {
      number: data.race,
    },
    level: {
      number: data.level,
    },
    core: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.core, link: null },
        },
      ],
    },
    class: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.class, link: null },
        },
      ],
    },
    skill: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.skill, link: null },
        },
      ],
    },
    ability: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.ability, link: null },
        },
      ],
    },
    element: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.element, link: null },
        },
      ],
    },
    equipment: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.equipment, link: null },
        },
      ],
    },
    filter: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.filter, link: null },
        },
      ],
    },
    cooldown: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.cooldown, link: null },
        },
      ],
    },
  };
}
