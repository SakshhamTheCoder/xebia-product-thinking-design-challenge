import mongoose from 'mongoose';

export const TRACKS = [
  'JavaScript',
  'React',
  'Node.js',
  'Cloud',
  'System Design',
  'DevOps',
];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

export const XP_BY_DIFFICULTY = {
  beginner: 50,
  intermediate: 100,
  advanced: 200,
};

const questSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
    },
    track: {
      type: String,
      enum: TRACKS,
      required: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      default: 'beginner',
    },
    xpReward: {
      type: Number,
      default: 50,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Quest', questSchema);
