import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Quest, { XP_BY_DIFFICULTY } from '../models/Quest.js';

const SAMPLE_QUESTS = [
  {
    title: 'JavaScript: Tame the Array',
    description: 'Master map, filter, and reduce by transforming a dataset of orders.',
    instructions:
      'Given an array of order objects, use map/filter/reduce to (1) keep only paid orders, (2) apply a 10% discount, and (3) return the total revenue. Share a link to your solution (e.g. a GitHub gist or CodeSandbox).',
    track: 'JavaScript',
    difficulty: 'beginner',
  },
  {
    title: 'React: Build a Reusable Modal',
    description: 'Create an accessible, controlled modal component with a backdrop.',
    instructions:
      'Build a <Modal open onClose> component that closes on backdrop click and Escape, traps focus, and renders its children. Submit a link to the component and a short demo.',
    track: 'React',
    difficulty: 'intermediate',
  },
  {
    title: 'Node.js: Rate-Limit an API',
    description: 'Add a fixed-window rate limiter middleware to an Express route.',
    instructions:
      'Implement Express middleware that allows N requests per IP per minute and returns HTTP 429 when exceeded. Explain your storage choice in the notes.',
    track: 'Node.js',
    difficulty: 'intermediate',
  },
  {
    title: 'System Design: Design a URL Shortener',
    description: 'Sketch the architecture, data model, and scaling plan for a TinyURL clone.',
    instructions:
      'Produce a short design doc covering the API, the encoding strategy, the database schema, and how you would scale reads. Link to your document.',
    track: 'System Design',
    difficulty: 'advanced',
  },
  {
    title: 'Cloud: Deploy a Static Site to S3 + CDN',
    description: 'Host a static site on object storage behind a CDN with HTTPS.',
    instructions:
      'Deploy any static site to S3 (or equivalent) fronted by a CDN with a TLS certificate. Submit the live URL and note the caching headers you chose.',
    track: 'Cloud',
    difficulty: 'beginner',
  },
  {
    title: 'DevOps: Containerize a Node App',
    description: 'Write a small, production-ready multi-stage Dockerfile.',
    instructions:
      'Containerize a Node service with a multi-stage build, a non-root user, and a healthcheck. Submit the Dockerfile and the final image size.',
    track: 'DevOps',
    difficulty: 'intermediate',
  },
];

async function upsertUser({ username, email, phone, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`• ${role} ${email} already exists`);
    return existing;
  }
  const user = await User.create({ username, email, phone, password, role });
  console.log(`✓ Created ${role}: ${email}`);
  return user;
}

async function seed() {
  await connectDB(process.env.MONGO_URI);

  await upsertUser({
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
    phone: process.env.SEED_ADMIN_PHONE || '0000000000',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  });

  const mentor = await upsertUser({
    username: process.env.SEED_MENTOR_USERNAME || 'mentor',
    email: (process.env.SEED_MENTOR_EMAIL || 'mentor@example.com').toLowerCase(),
    phone: process.env.SEED_MENTOR_PHONE || '1111111111',
    password: process.env.SEED_MENTOR_PASSWORD || 'mentor123',
    role: 'mentor',
  });

  const questCount = await Quest.countDocuments();
  if (questCount === 0) {
    await Quest.insertMany(
      SAMPLE_QUESTS.map((q) => ({
        ...q,
        xpReward: XP_BY_DIFFICULTY[q.difficulty],
        createdBy: mentor._id,
        published: true,
      }))
    );
    console.log(`✓ Seeded ${SAMPLE_QUESTS.length} starter quests (author: ${mentor.email})`);
  } else {
    console.log(`• ${questCount} quests already exist; skipping catalog seed`);
  }

  console.log('\nSeed complete. Log in with the seeded admin or mentor, or register as a learner.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
