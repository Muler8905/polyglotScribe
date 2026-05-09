import mongoose from 'mongoose';

const transcriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['live', 'file', 'youtube'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  sourceUrl: {
    type: String,
    default: null
  },
  sourceLang: {
    type: String,
    default: null
  },
  targetLang: {
    type: String,
    default: null
  },
  transcript: {
    type: String,
    default: ''
  },
  translation: {
    type: String,
    default: null
  },
  durationSeconds: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
transcriptionSchema.index({ userId: 1, createdAt: -1 });
transcriptionSchema.index({ status: 1 });

const Transcription = mongoose.model('Transcription', transcriptionSchema);

export default Transcription;
