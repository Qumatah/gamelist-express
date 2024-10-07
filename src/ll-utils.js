export function getLLBuild(build) {
  return {
    id: build.id,
    name: build.properties?.name.title[0].plain_text || "",
    hp: build.properties?.hp.number || 0,
    shield: build.properties?.shield.number || 0,
    level: build.properties?.level.number || 0,
    core: build.properties?.core.rich_text[0].plain_text || "",
    class: build.properties?.class.rich_text[0].plain_text || "",
    skill: build.properties?.skill.rich_text[0].plain_text || "",
    ability: build.properties?.ability.rich_text[0].plain_text || "",
    element: build.properties?.element.rich_text[0].plain_text || "",
    equipment: build.properties?.equipment.rich_text[0].plain_text || "",
    filter: build.properties?.filter.rich_text[0].plain_text || "",
    cooldown: build.properties?.cooldown.rich_text[0].plain_text || "",
    artifact: build.properties?.artifact.rich_text[0].plain_text || "",
    trinket: build.properties?.trinket.rich_text[0].plain_text || "",
    set: build.properties?.set.rich_text[0].plain_text || "",
    item: build.properties?.item.rich_text[0].plain_text || "",
    grace: build.properties?.grace.rich_text[0].plain_text || "",
    buff: build.properties?.buff.rich_text[0].plain_text || "",
    note: build.properties?.note.rich_text[0].plain_text || "",
    setting: build.properties?.setting.rich_text[0].plain_text || "",
  };
}

export function getPropertiesObject(data) {
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
    shield: {
      number: data.shield,
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
    artifact: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.artifact, link: null },
        },
      ],
    },
    trinket: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.trinket, link: null },
        },
      ],
    },
    set: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.set, link: null },
        },
      ],
    },
    item: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.item, link: null },
        },
      ],
    },
    grace: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.grace, link: null },
        },
      ],
    },
    buff: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.buff, link: null },
        },
      ],
    },
    note: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.note, link: null },
        },
      ],
    },
    setting: {
      type: "rich_text",
      rich_text: [
        {
          type: "text",
          text: { content: data.setting, link: null },
        },
      ],
    },
  };
}
