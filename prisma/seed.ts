/**
 * Seed: 8 Canadian properties, amenities, reviews, a manager user,
 * sample bookings in every status, and one availability block —
 * so every screen has realistic data from day one.
 *
 * Images are picsum placeholders (seeded per property → stable across runs).
 * Swap for Cloudinary IDs when real photography arrives.
 */
import "dotenv/config";
import { PrismaClient, BookingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const AMENITIES: Array<[string, string]> = [
  ["High-speed Wi-Fi", "wifi"],
  ["Full kitchen", "chef-hat"],
  ["Free parking", "circle-parking"],
  ["Air conditioning", "snowflake"],
  ["Fireplace", "flame"],
  ["Hot tub", "waves"],
  ["Private pool", "waves-ladder"],
  ["Washer & dryer", "washing-machine"],
  ["Dedicated workspace", "laptop"],
  ["EV charger", "plug-zap"],
  ["Lake access", "sailboat"],
  ["Mountain view", "mountain"],
];

type SeedProperty = {
  title: string;
  slug: string;
  location: string;
  priceCents: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  minNights: number;
  summary: string;
  description: string;
  amenities: string[];
};

const PROPERTIES: SeedProperty[] = [
  {
    title: "The Glass Pavilion",
    slug: "glass-pavilion",
    location: "Whistler, British Columbia",
    priceCents: 42000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 2,
    minNights: 2,
    summary:
      "Floor-to-ceiling glass framing the Coast Mountains, minutes from the village.",
    description:
      "Set among old-growth cedars on the quiet side of Whistler, the Glass Pavilion dissolves the line between inside and out. Mornings begin with alpenglow on Blackcomb through eleven-foot windows; evenings end in the cedar hot tub under a sky untouched by city light. The interior pairs board-formed concrete with warm oak and wool, and the kitchen is equipped for serious cooking after a day on the hill. The village shuttle stops two hundred metres from the door.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Free parking",
      "Fireplace",
      "Hot tub",
      "Mountain view",
      "EV charger",
      "Dedicated workspace",
    ],
  },
  {
    title: "Cedar & Stone Cabin",
    slug: "cedar-and-stone-cabin",
    location: "Canmore, Alberta",
    priceCents: 28500,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    minNights: 2,
    summary:
      "A hand-built timber cabin with the Three Sisters peaks filling every window.",
    description:
      "Built by a local timber-framer from Douglas fir and Rundle stone, this cabin is Canmore distilled: honest materials, mountain silence, and coffee on a porch that faces the Three Sisters. The wood stove heats the whole cabin through winter; in summer the Bow River trail begins at the property line. Banff National Park's gates are a twenty-minute drive.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Free parking",
      "Fireplace",
      "Mountain view",
    ],
  },
  {
    title: "Harbourfront Loft",
    slug: "harbourfront-loft",
    location: "Vancouver, British Columbia",
    priceCents: 31000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    minNights: 1,
    summary:
      "A converted warehouse loft in Gastown with harbour views and heritage brick.",
    description:
      "On the top floor of an 1898 warehouse, this loft keeps its bones — exposed brick, fir beams, twelve-foot ceilings — and adds a precise, calm interior of white oak and linen. Watch the seaplanes land from the window seat, walk to the city's best restaurants in five minutes, and come home to one of the quietest streets in Gastown.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Air conditioning",
      "Dedicated workspace",
      "Washer & dryer",
    ],
  },
  {
    title: "Muskoka Lakeside Villa",
    slug: "muskoka-lakeside-villa",
    location: "Lake Muskoka, Ontario",
    priceCents: 56000,
    maxGuests: 10,
    bedrooms: 5,
    beds: 7,
    bathrooms: 3,
    minNights: 3,
    summary:
      "Three hundred feet of private shoreline, a wraparound dock, and room for everyone.",
    description:
      "The villa sits on a granite point with south-west exposure — sun on the dock from noon until the last light. Five bedrooms sleep ten without bunk-bed compromises, the great room's stone fireplace anchors cool evenings, and the boathouse holds canoes, paddleboards, and a vintage cedar-strip runabout. Muskoka's classic supper clubs are ten minutes by boat.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Free parking",
      "Fireplace",
      "Hot tub",
      "Lake access",
      "Washer & dryer",
      "EV charger",
    ],
  },
  {
    title: "Mont-Tremblant Chalet",
    slug: "mont-tremblant-chalet",
    location: "Mont-Tremblant, Québec",
    priceCents: 38000,
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 2,
    minNights: 2,
    summary:
      "Ski-in access, a stone fireplace two storeys tall, and the Laurentians at the door.",
    description:
      "A true Laurentian chalet rebuilt for this century: triple-glazed windows keep the great room warm at minus twenty, while the two-storey fieldstone fireplace does what it has done for eighty years. Ski out the back door to the Nansen trail in winter; in summer, Lac Tremblant's beach and the village's terrasses are five minutes away. Sleeps eight in four proper bedrooms.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Free parking",
      "Fireplace",
      "Hot tub",
      "Mountain view",
      "Washer & dryer",
    ],
  },
  {
    title: "County Farmhouse",
    slug: "county-farmhouse",
    location: "Prince Edward County, Ontario",
    priceCents: 24500,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    minNights: 2,
    summary:
      "A restored 1870s farmhouse among the vineyards, ten minutes from Sandbanks.",
    description:
      "This farmhouse has watched the County change from barley to grapes, and its restoration honours both eras: original pine floors and plaster walls, a chef's kitchen opening to a screened porch, and three acres of meadow that end at a neighbouring vineyard's rows. Sandbanks' dunes are ten minutes by car; a dozen wineries are closer than that.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Free parking",
      "Air conditioning",
      "Fireplace",
      "Washer & dryer",
    ],
  },
  {
    title: "Tofino Surf House",
    slug: "tofino-surf-house",
    location: "Tofino, British Columbia",
    priceCents: 33500,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    minNights: 2,
    summary:
      "Cedar-shingled and storm-proof, a walk through the forest from Chesterman Beach.",
    description:
      "Behind a curtain of shore pine and salal, the Surf House is built for the coast's two seasons: surf and storm. An outdoor shower and drying room handle wetsuits; the window wall handles November's theatre of weather. Chesterman Beach is a four-minute walk on a forest boardwalk, and town is a ten-minute cycle on the multi-use path.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Free parking",
      "Fireplace",
      "Dedicated workspace",
    ],
  },
  {
    title: "Old Québec Pied-à-terre",
    slug: "old-quebec-pied-a-terre",
    location: "Québec City, Québec",
    priceCents: 22000,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    minNights: 1,
    summary:
      "Seventeenth-century stone walls inside the ramparts, steps from Place Royale.",
    description:
      "Inside the walls of the old city, this apartment occupies the second floor of a 1685 merchant's house. The stone walls are three feet thick, the ceiling beams original, and the renovation quietly modern — heated floors, a proper espresso setup, blackout linen curtains. Place Royale, the funicular, and the best table in the Petit Champlain are all within three hundred metres.",
    amenities: [
      "High-speed Wi-Fi",
      "Full kitchen",
      "Air conditioning",
      "Washer & dryer",
    ],
  },
];

const REVIEWS: Array<{ slug: string; author: string; rating: number; body: string; month: string }> = [
  { slug: "glass-pavilion", author: "Claire D.", rating: 5, month: "February 2026", body: "The photographs undersell it. We watched snow fall into the trees from the hot tub every night. Immaculate, silent, unforgettable." },
  { slug: "glass-pavilion", author: "Thomas R.", rating: 5, month: "December 2025", body: "Best-equipped kitchen I've seen in a rental, and the shuttle to the village genuinely is two minutes away." },
  { slug: "cedar-and-stone-cabin", author: "Amara S.", rating: 5, month: "July 2026", body: "Woke up to elk in the meadow. The cabin is small, warm, and perfect — exactly what it promises to be." },
  { slug: "harbourfront-loft", author: "Julien M.", rating: 4, month: "May 2026", body: "Beautiful bones and a flawless location. Light sleepers should bring earplugs for Saturday nights — it is Gastown, after all." },
  { slug: "muskoka-lakeside-villa", author: "The Hendersons", rating: 5, month: "August 2025", body: "Three families, one dock, zero complaints. The boathouse toys made the week. Booking again for next summer." },
  { slug: "mont-tremblant-chalet", author: "Sophie L.", rating: 5, month: "January 2026", body: "Ski-out access is real — we clicked in at the back door. Après by that fireplace is something else." },
  { slug: "county-farmhouse", author: "Daniel K.", rating: 5, month: "September 2025", body: "The screened porch at dusk, a bottle from the vineyard next door. We didn't want to leave, so we extended twice." },
  { slug: "tofino-surf-house", author: "Mia W.", rating: 5, month: "November 2025", body: "Came for storm season. The drying room and outdoor shower show that surfers designed this. Chesterman is genuinely four minutes." },
  { slug: "old-quebec-pied-a-terre", author: "Hannah B.", rating: 5, month: "June 2026", body: "Three-foot stone walls and total silence in the middle of the old city. The heated floors are a small miracle." },
];

function img(slug: string, n: number) {
  return `https://picsum.photos/seed/${slug}-${n}/1600/1067`;
}

function daysFromNow(d: number) {
  const t = new Date();
  t.setUTCHours(0, 0, 0, 0);
  t.setUTCDate(t.getUTCDate() + d);
  return t;
}

async function main() {
  // Wipe in dependency order (idempotent reseed)
  await db.booking.deleteMany();
  await db.availabilityBlock.deleteMany();
  await db.review.deleteMany();
  await db.propertyAmenity.deleteMany();
  await db.propertyImage.deleteMany();
  await db.property.deleteMany();
  await db.amenity.deleteMany();
  await db.user.deleteMany();

  // Manager with dev credentials (change password before production!)
  const managerPassword = process.env.SEED_MANAGER_PASSWORD ?? "manager123";
  const manager = await db.user.create({
    data: {
      name: "Property Manager",
      email: "manager@example.com",
      role: "manager",
      accountStatus: "active",
      accounts: {
        create: {
          type: "credentials",
          provider: "credentials",
          providerAccountId: "manager@example.com",
          passwordHash: await bcrypt.hash(managerPassword, 12),
        },
      },
    },
  });

  // Amenities
  const amenityByName = new Map<string, string>();
  for (const [i, [name, icon]] of AMENITIES.entries()) {
    const a = await db.amenity.create({ data: { name, icon, sortOrder: i } });
    amenityByName.set(name, a.id);
  }

  // Properties + images + amenities + reviews
  const propBySlug = new Map<string, string>();
  for (const p of PROPERTIES) {
    const created = await db.property.create({
      data: {
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        description: p.description,
        location: p.location,
        priceCents: p.priceCents,
        currency: "USD",
        maxGuests: p.maxGuests,
        bedrooms: p.bedrooms,
        beds: p.beds,
        bathrooms: p.bathrooms,
        minNights: p.minNights,
        images: {
          create: Array.from({ length: 5 }, (_, n) => ({
            src: img(p.slug, n + 1),
            alt: `${p.title} — photo ${n + 1}`,
            sortOrder: n,
            isPrimary: n === 0,
          })),
        },
        amenities: {
          create: p.amenities.map((name) => ({
            amenityId: amenityByName.get(name)!,
          })),
        },
      },
    });
    propBySlug.set(p.slug, created.id);
  }

  for (const r of REVIEWS) {
    await db.review.create({
      data: {
        propertyId: propBySlug.get(r.slug)!,
        authorName: r.author,
        rating: r.rating,
        body: r.body,
        stayedMonth: r.month,
      },
    });
  }

  // A guest customer with history (unclaimed — exists through bookings)
  const guest = await db.user.create({
    data: {
      name: "Eleanor Vance",
      email: "eleanor@example.com",
      phone: "+1 604 555 0132",
      accountStatus: "unclaimed",
      marketingOptIn: true,
      marketingOptInAt: new Date(),
    },
  });

  const glass = propBySlug.get("glass-pavilion")!;
  const muskoka = propBySlug.get("muskoka-lakeside-villa")!;

  const mkBooking = (
    code: string,
    propertyId: string,
    checkInDays: number,
    nights: number,
    nightly: number,
    status: BookingStatus,
    extra: Record<string, unknown> = {}
  ) => ({
    code,
    propertyId,
    guestName: "Eleanor Vance",
    guestEmail: "eleanor@example.com",
    guestPhone: "+1 604 555 0132",
    guestCount: 2,
    checkIn: daysFromNow(checkInDays),
    checkOut: daysFromNow(checkInDays + nights),
    nightlyPriceCents: nightly,
    totalCents: nightly * nights,
    currency: "USD",
    status,
    userId: guest.id,
    ...extra,
  });

  // One booking per interesting status
  await db.booking.create({
    data: mkBooking("LUM-10001", glass, -30, 4, 42000, "completed"),
  });
  await db.booking.create({
    data: mkBooking("LUM-10002", muskoka, 14, 5, 56000, "confirmed"),
  });
  await db.booking.create({
    data: mkBooking("LUM-10003", glass, 21, 3, 42000, "pending", {
      guestName: "Julian Dashwood",
      guestEmail: "julian@example.com",
      guestPhone: "+1 416 555 0187",
      guestMessage: "Late arrival around 10pm if that's alright.",
      userId: undefined,
    }),
  });
  await db.booking.create({
    data: mkBooking("LUM-10004", muskoka, 40, 4, 56000, "cancelled", {
      statusNote: "Guest plans changed; cancelled by manager on request.",
    }),
  });

  // Maintenance block (D4)
  await db.availabilityBlock.create({
    data: {
      propertyId: glass,
      startDate: daysFromNow(7),
      endDate: daysFromNow(10),
      note: "Hot tub resurfacing",
    },
  });

  const counts = {
    properties: await db.property.count(),
    images: await db.propertyImage.count(),
    amenities: await db.amenity.count(),
    reviews: await db.review.count(),
    bookings: await db.booking.count(),
    blocks: await db.availabilityBlock.count(),
    users: await db.user.count(),
  };
  console.log("Seed complete:", counts, `manager=${manager.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
