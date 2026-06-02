import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema(
  {
    learner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'approved', 'changes_requested'],
      default: 'in_progress',
    },
    submissionUrl: { type: String, default: '' },
    submissionNotes: { type: String, default: '' },
    mentorFeedback: { type: String, default: '' },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attemptSchema.index({ learner: 1, quest: 1 }, { unique: true });

export default mongoose.model('Attempt', attemptSchema);
