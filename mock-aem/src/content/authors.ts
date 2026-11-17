import { DAM_ROOT, b, i, image, p, rt } from "./helpers";
import { fragment } from "./fragment";

export const authorPath = (slug: string) => `${DAM_ROOT}/en/contributors/${slug}`;

const author = (
  slug: string,
  firstName: string,
  lastName: string,
  occupation: string,
  instagram: string,
  bio: ReturnType<typeof rt>,
) =>
  fragment({
    path: authorPath(slug),
    model: "author",
    title: `${firstName} ${lastName}`,
    lastModified: "2026-02-03T14:05:00.000Z",
    master: {
      firstName,
      lastName,
      occupation,
      instagram,
      bio,
      profilePicture: image(`${DAM_ROOT}/en/contributors/${slug}.jpg`, {
        title: `${firstName} ${lastName}`,
        width: 800,
        height: 800,
        scene: "portrait",
      }),
    },
  });

export const authors = [
  author(
    "stacey-roswells",
    "Stacey",
    "Roswells",
    "Surf instructor & travel writer",
    "@stacey.surfs",
    rt(
      p("Stacey has taught surfing on four continents and still gets nervous before a ", b("dawn patrol"), "."),
      p("She writes the WKND ", i("Ocean"), " column and leads our beginner camps."),
    ),
  ),
  author(
    "jacob-wester",
    "Jacob",
    "Wester",
    "IFMGA mountain guide",
    "@jacob.on.ridges",
    rt(p("Jacob guides ski tours in the Alps every winter and rock routes in New Zealand every summer.")),
  ),
  author(
    "sofia-sjoberg",
    "Sofia",
    "Sjöberg",
    "Outdoor photographer",
    "@sofia.sees",
    rt(
      p("Sofia's photographs have taken her from Arctic Norway to the Australian outback."),
      p("She believes the best camera is the one you are ", b("willing to carry"), "."),
    ),
  ),
  author(
    "ian-provo",
    "Ian",
    "Provo",
    "Cycling journalist",
    "@ian.rides.far",
    rt(p("Ian has ridden every route in our cycling catalogue — some of them twice, one of them by accident.")),
  ),
  author(
    "kumar-selvaraj",
    "Kumar",
    "Selvaraj",
    "Food & culture editor",
    "@kumar.eats",
    rt(p("Kumar plans every trip around lunch and is unapologetic about it.")),
  ),
];
