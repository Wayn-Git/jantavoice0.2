const router = require('express').Router();
const {
  createComplaint, getAllComplaints, getStats, getMyComplaints,
  getComplaintById, likeComplaint, addComment, updateStatus,
  deleteComplaint, aiCategorize,
} = require('../controllers/complaintController');
const { protect, adminOnly } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');

router.post('/ai-categorize', protect, aiCategorize);
router.get('/stats', protect, adminOnly, getStats);
router.get('/my', protect, getMyComplaints);
router.post('/', protect, complaintLimiter, upload.array('images', 3), createComplaint);
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.put('/:id/like', protect, likeComplaint);
router.post('/:id/comment', protect, addComment);
router.put('/:id/status', protect, adminOnly, updateStatus);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;
